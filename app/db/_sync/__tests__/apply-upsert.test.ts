// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

vi.mock('@tauri-apps/plugin-sql', async () => {
  const { openTestDatabase } =
    await import('@db/__tests__/support/sqlite-test-database');
  return { default: { load: () => Promise.resolve(openTestDatabase()) } };
});

const LOCAL_UPDATED_AT = '2026-03-01T00:00:00.000Z';
const OLDER = '2026-02-01T00:00:00.000Z';
const NEWER = '2026-04-01T00:00:00.000Z';
const TOMBSTONE_AT = '2030-06-01T00:00:00.000Z';
const YEAR_BEFORE_TOMBSTONE = '2029-06-01T00:00:00.000Z';
const YEAR_AFTER_TOMBSTONE = '2031-06-01T00:00:00.000Z';

type Row = Record<string, unknown>;

const readRow = async (table: string, id: string) => {
  const { getDatabase } = await import('@db/database');
  const db = await getDatabase();
  const rows = await db.select<Row[]>(`SELECT * FROM ${table} WHERE id = $1`, [
    id,
  ]);
  return rows.at(0);
};

const countRows = async (table: string) => {
  const { getDatabase } = await import('@db/database');
  const db = await getDatabase();
  const [row] = await db.select<{ count: number }[]>(
    `SELECT COUNT(*) AS count FROM ${table}`,
  );
  return row.count;
};

// A row as a peer sends it: a real row's shape with a new identity and timestamp, read the way the push side reads it.
const peerRowLike = async (
  table: string,
  sourceId: string,
  overrides: Row,
): Promise<Row> => {
  const { getRowById } = await import('../get-row-by-id');
  const row = await getRowById(table, sourceId);
  if (row === null)
    throw new Error(`Fixture row missing: ${table}:${sourceId}`);
  return { ...row, ...overrides };
};

const countNpcsConfigs = async () => {
  const { getDatabase } = await import('@db/database');
  const db = await getDatabase();
  return db.select<{ id: string; color: string }[]>(
    "SELECT id, color FROM table_config WHERE table_name = 'npcs'",
  );
};

const readSeededConfigId = async (tableName: string) => {
  const { getDatabase } = await import('@db/database');
  const db = await getDatabase();
  const [row] = await db.select<{ id: string }[]>(
    'SELECT id FROM table_config WHERE table_name = $1',
    [tableName],
  );
  return row.id;
};

describe('applyUpsert', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(LOCAL_UPDATED_AT));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('applies new adventure, session and session step rows whose nullable text columns are null', async () => {
    const { create: createAdventure } = await import('@db/adventure');
    const { create: createSession } = await import('@db/session');
    const { create: createStep } = await import('@db/session-step');
    const { applyUpsert } = await import('../apply-upsert');
    const adventureId = await createAdventure();
    const sessionId = await createSession(adventureId);
    const stepId = await createStep({ session_id: sessionId, sort_order: 0 });
    const peerAdventure = await peerRowLike('adventures', adventureId, {
      id: 'peer-adventure',
      updated_at: NEWER,
    });
    const peerSession = await peerRowLike('sessions', sessionId, {
      id: 'peer-session',
      updated_at: NEWER,
    });
    const peerStep = await peerRowLike('session_steps', stepId, {
      id: 'peer-step',
      updated_at: NEWER,
    });

    expect(await applyUpsert('adventures', peerAdventure, false)).toBe(
      'applied',
    );
    expect(await applyUpsert('sessions', peerSession, false)).toBe('applied');
    expect(await applyUpsert('session_steps', peerStep, false)).toBe('applied');

    expect(await readRow('adventures', 'peer-adventure')).toMatchObject({
      description: null,
      image_id: null,
    });
    expect(await readRow('sessions', 'peer-session')).toMatchObject({
      name: null,
      description: null,
      summary: null,
      session_date: null,
    });
    expect(await readRow('session_steps', 'peer-step')).toMatchObject({
      name: null,
      content: null,
      default_step_key: null,
    });
  });

  it.each([
    [
      'a missing id',
      (row: Row): Row => {
        const { id: _omitted, ...withoutId } = row;
        return withoutId;
      },
    ],
    ['an empty id', (row: Row): Row => ({ ...row, id: '' })],
    ['an empty updated_at', (row: Row): Row => ({ ...row, updated_at: '' })],
  ])('skips a row with %s and writes nothing', async (_defect, breakRow) => {
    const { create } = await import('@db/adventure');
    const { applyUpsert } = await import('../apply-upsert');
    const { getMaxSeq } = await import('../get-max-seq');
    const sourceId = await create();
    const row = breakRow(
      await peerRowLike('adventures', sourceId, {
        id: 'peer-adventure',
        updated_at: NEWER,
      }),
    );
    const seqBefore = await getMaxSeq();

    const result = await applyUpsert('adventures', row, false);

    expect(result).toBe('skipped');
    expect(await countRows('adventures')).toBe(1);
    expect(await getMaxSeq()).toBe(seqBefore);
  });

  it('keeps a local row that is newer than the incoming one', async () => {
    const { create, update } = await import('@db/adventure');
    const { applyUpsert } = await import('../apply-upsert');
    const id = await create();
    await update(id, { name: 'Local name' });
    const incoming = await peerRowLike('adventures', id, {
      name: 'Incoming name',
      updated_at: OLDER,
    });

    const result = await applyUpsert('adventures', incoming, false);

    expect(result).toBe('skipped');
    expect(await readRow('adventures', id)).toMatchObject({
      name: 'Local name',
    });
  });

  it('breaks a timestamp tie in favor of the incoming row only when force is set', async () => {
    const { create, update } = await import('@db/adventure');
    const { applyUpsert } = await import('../apply-upsert');
    const id = await create();
    await update(id, { name: 'Local name' });
    const incoming = await peerRowLike('adventures', id, {
      name: 'Incoming name',
      updated_at: LOCAL_UPDATED_AT,
    });

    expect(await applyUpsert('adventures', incoming, false)).toBe('skipped');
    expect(await readRow('adventures', id)).toMatchObject({
      name: 'Local name',
    });

    expect(await applyUpsert('adventures', incoming, true)).toBe('applied');
    expect(await readRow('adventures', id)).toMatchObject({
      name: 'Incoming name',
    });
  });

  it('stores an incoming row that is newer than the local one', async () => {
    const { create, update } = await import('@db/adventure');
    const { applyUpsert } = await import('../apply-upsert');
    const id = await create();
    await update(id, { name: 'Local name' });
    const incoming = await peerRowLike('adventures', id, {
      name: 'Incoming name',
      updated_at: NEWER,
    });

    const result = await applyUpsert('adventures', incoming, false);

    expect(result).toBe('applied');
    expect(await readRow('adventures', id)).toMatchObject({
      name: 'Incoming name',
      updated_at: NEWER,
    });
  });

  describe('after a recorded deletion', () => {
    const incomingRowFor = async (updatedAt: string) => {
      const { create } = await import('@db/adventure');
      const sourceId = await create();
      return peerRowLike('adventures', sourceId, {
        id: 'deleted-adventure',
        name: 'Peer name',
        updated_at: updatedAt,
      });
    };

    it('skips an incoming row a year older than the tombstone and leaves the row absent', async () => {
      const { applyDelete } = await import('../apply-delete');
      const { applyUpsert } = await import('../apply-upsert');
      await applyDelete('adventures', 'deleted-adventure', TOMBSTONE_AT);
      const incoming = await incomingRowFor(YEAR_BEFORE_TOMBSTONE);

      const result = await applyUpsert('adventures', incoming, false);

      expect(result).toBe('skipped');
      expect(await readRow('adventures', 'deleted-adventure')).toBeUndefined();
    });

    it('stores an incoming row a year newer than the tombstone and makes its change record live again', async () => {
      const { applyDelete } = await import('../apply-delete');
      const { applyUpsert } = await import('../apply-upsert');
      await applyDelete('adventures', 'deleted-adventure', TOMBSTONE_AT);
      const incoming = await incomingRowFor(YEAR_AFTER_TOMBSTONE);

      const result = await applyUpsert('adventures', incoming, false);

      expect(result).toBe('applied');
      expect(await readRow('adventures', 'deleted-adventure')).toMatchObject({
        name: 'Peer name',
      });
      expect(
        await readRow('_sync_changes', 'adventures:deleted-adventure'),
      ).toMatchObject({ deleted: 0 });
    });

    it('stores an incoming row that carries the exact timestamp of the tombstone', async () => {
      const { applyDelete } = await import('../apply-delete');
      const { applyUpsert } = await import('../apply-upsert');
      await applyDelete('adventures', 'deleted-adventure', TOMBSTONE_AT);
      const incoming = await incomingRowFor(TOMBSTONE_AT);

      const result = await applyUpsert('adventures', incoming, false);

      expect(result).toBe('applied');
      expect(await readRow('adventures', 'deleted-adventure')).toBeDefined();
    });

    it('does not let a tombstone keep an older table_config row over a newer update', async () => {
      const { applyDelete } = await import('../apply-delete');
      const { applyUpsert } = await import('../apply-upsert');
      const seededId = await readSeededConfigId('npcs');
      const seededConfig = await peerRowLike('table_config', seededId, {});
      const replacement = {
        ...seededConfig,
        id: 'replacement-npcs-config',
        color: 'replacement color',
        updated_at: '2030-01-01T00:00:00.000Z',
      };
      expect(await applyUpsert('table_config', replacement, false)).toBe(
        'applied',
      );
      await applyDelete('table_config', seededId, '2050-01-01T00:00:00.000Z');
      const update = {
        ...seededConfig,
        color: 'update color',
        updated_at: '2040-01-01T00:00:00.000Z',
      };

      const result = await applyUpsert('table_config', update, false);

      expect(result).toBe('applied');
      const npcsConfigs = await countNpcsConfigs();
      expect(npcsConfigs).toEqual([{ id: seededId, color: 'update color' }]);
    });
  });

  it('applies a row with a key the registry does not list, ignoring that key, and skips a row with a wrong-typed column', async () => {
    const { create } = await import('@db/adventure');
    const { applyUpsert } = await import('../apply-upsert');
    const sourceId = await create();
    const withExtraKey = await peerRowLike('adventures', sourceId, {
      id: 'peer-extra-key',
      updated_at: NEWER,
      extra_key: 'ignored',
    });
    const withWrongType = await peerRowLike('adventures', sourceId, {
      id: 'peer-wrong-type',
      updated_at: NEWER,
      name: 5,
    });

    expect(await applyUpsert('adventures', withExtraKey, false)).toBe(
      'applied',
    );
    expect(await applyUpsert('adventures', withWrongType, false)).toBe(
      'skipped',
    );

    expect(await readRow('adventures', 'peer-extra-key')).toBeDefined();
    expect(await readRow('adventures', 'peer-wrong-type')).toBeUndefined();
  });

  it('skips a session whose adventure does not exist', async () => {
    const { create: createAdventure } = await import('@db/adventure');
    const { create: createSession } = await import('@db/session');
    const { applyUpsert } = await import('../apply-upsert');
    const sessionId = await createSession(await createAdventure());
    const orphan = await peerRowLike('sessions', sessionId, {
      id: 'peer-orphan',
      adventure_id: 'missing-adventure',
      updated_at: NEWER,
    });

    const result = await applyUpsert('sessions', orphan, false);

    expect(result).toBe('skipped');
    expect(await readRow('sessions', 'peer-orphan')).toBeUndefined();
  });

  it('merges an incoming config for the same table by table name, keeping one row with the incoming id and values and a tombstone for the replaced id', async () => {
    const { applyUpsert } = await import('../apply-upsert');
    const seededId = await readSeededConfigId('npcs');
    const incoming = await peerRowLike('table_config', seededId, {
      id: 'incoming-npcs-config',
      color: 'incoming color',
      updated_at: '2030-01-01T00:00:00.000Z',
    });

    const result = await applyUpsert('table_config', incoming, false);

    expect(result).toBe('applied');
    expect(await countNpcsConfigs()).toEqual([
      { id: 'incoming-npcs-config', color: 'incoming color' },
    ]);
    expect(
      await readRow('_sync_changes', `table_config:${seededId}`),
    ).toMatchObject({ deleted: 1 });
  });

  it('skips an incoming config that is older than the local one and a config for a table that is not an entity type', async () => {
    const { applyUpsert } = await import('../apply-upsert');
    const seededId = await readSeededConfigId('npcs');
    const older = await peerRowLike('table_config', seededId, {
      id: 'older-npcs-config',
      color: 'older color',
      updated_at: '2000-01-01T00:00:00.000Z',
    });
    const notAnEntity = await peerRowLike('table_config', seededId, {
      id: 'custom-config',
      table_name: 'custom',
      updated_at: '2030-01-01T00:00:00.000Z',
    });

    expect(await applyUpsert('table_config', older, false)).toBe('skipped');
    expect(await applyUpsert('table_config', notAnEntity, false)).toBe(
      'skipped',
    );

    expect((await countNpcsConfigs()).map((config) => config.id)).toEqual([
      seededId,
    ]);
    expect(await readRow('table_config', 'custom-config')).toBeUndefined();
  });

  it('skips a table missing from the sync registry and writes nothing', async () => {
    const { applyUpsert } = await import('../apply-upsert');
    const deviceId = 'a'.repeat(64);

    const result = await applyUpsert(
      'paired_devices',
      {
        id: deviceId,
        name: null,
        created_at: NEWER,
        updated_at: NEWER,
      },
      false,
    );

    expect(result).toBe('skipped');
    expect(await countRows('paired_devices')).toBe(0);
  });
});
