// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

vi.mock('@tauri-apps/plugin-sql', async () => {
  const { openTestDatabase } =
    await import('@db/__tests__/support/sqlite-test-database');
  return { default: { load: () => Promise.resolve(openTestDatabase()) } };
});

const LOCAL_UPDATED_AT = '2026-03-01T00:00:00.000Z';
// Unlike any instant this device's own clock could produce, so a deletion time taken from that clock shows.
const DELETED_AT = '2030-06-01T00:00:00.000Z';
const LATER_DELETED_AT = '2031-06-01T00:00:00.000Z';
const EARLIER_DELETED_AT = '2029-06-01T00:00:00.000Z';

type Change = { seq: number; deleted: number; deleted_at: string | null };

// The change record id is read in its documented `<table>:<id>` shape, the one the sync triggers build in SQL.
const readChange = async (tableName: string, rowId: string) => {
  const { getDatabase } = await import('@db/database');
  const db = await getDatabase();
  const rows = await db.select<Change[]>(
    'SELECT seq, deleted, deleted_at FROM _sync_changes WHERE id = $1',
    [`${tableName}:${rowId}`],
  );
  return rows.at(0);
};

describe('applyDelete', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(LOCAL_UPDATED_AT));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('deletes a local row older than the deletion and records the incoming deletion time, not this device clock', async () => {
    const { create } = await import('@db/adventure');
    const { getDatabase } = await import('@db/database');
    const { applyDelete } = await import('../apply-delete');
    const id = await create();

    const result = await applyDelete('adventures', id, DELETED_AT);

    expect(result).toBe('applied');
    const db = await getDatabase();
    expect(
      await db.select<unknown[]>('SELECT id FROM adventures WHERE id = $1', [
        id,
      ]),
    ).toEqual([]);
    expect(await readChange('adventures', id)).toMatchObject({
      deleted: 1,
      deleted_at: DELETED_AT,
    });
  });

  it.each([
    ['equals', LOCAL_UPDATED_AT],
    ['is later than', '2026-02-01T00:00:00.000Z'],
  ])(
    'keeps a local row whose updated_at %s the deletion time',
    async (_relation, deletedAt) => {
      const { create } = await import('@db/adventure');
      const { getDatabase } = await import('@db/database');
      const { applyDelete } = await import('../apply-delete');
      const id = await create();

      const result = await applyDelete('adventures', id, deletedAt);

      expect(result).toBe('skipped');
      const db = await getDatabase();
      expect(
        await db.select<unknown[]>('SELECT id FROM adventures WHERE id = $1', [
          id,
        ]),
      ).toHaveLength(1);
      expect(await readChange('adventures', id)).toMatchObject({ deleted: 0 });
    },
  );

  it('records a tombstone for a row it never had, with the incoming deletion time and a new seq', async () => {
    const { applyDelete } = await import('../apply-delete');
    const { getMaxSeq } = await import('../get-max-seq');
    const seqBefore = await getMaxSeq();

    const result = await applyDelete('adventures', 'never-stored', DELETED_AT);

    expect(result).toBe('applied');
    const tombstone = await readChange('adventures', 'never-stored');
    expect(tombstone).toMatchObject({ deleted: 1, deleted_at: DELETED_AT });
    expect(tombstone?.seq).toBeGreaterThan(seqBefore);
  });

  it('skips a deletion already recorded with the same or a later deletion time, leaving the counter and the tombstone alone', async () => {
    const { applyDelete } = await import('../apply-delete');
    const { getMaxSeq } = await import('../get-max-seq');
    await applyDelete('adventures', 'gone-adventure', DELETED_AT);
    const seqAfterFirst = await getMaxSeq();
    const tombstoneAfterFirst = await readChange(
      'adventures',
      'gone-adventure',
    );

    const sameTime = await applyDelete(
      'adventures',
      'gone-adventure',
      DELETED_AT,
    );
    const earlierTime = await applyDelete(
      'adventures',
      'gone-adventure',
      EARLIER_DELETED_AT,
    );

    expect([sameTime, earlierTime]).toEqual(['skipped', 'skipped']);
    expect(await getMaxSeq()).toBe(seqAfterFirst);
    expect(await readChange('adventures', 'gone-adventure')).toEqual(
      tombstoneAfterFirst,
    );
  });

  it('updates a recorded tombstone to a later deletion time under a new seq', async () => {
    const { applyDelete } = await import('../apply-delete');
    await applyDelete('adventures', 'gone-adventure', DELETED_AT);
    const before = await readChange('adventures', 'gone-adventure');

    const result = await applyDelete(
      'adventures',
      'gone-adventure',
      LATER_DELETED_AT,
    );

    expect(result).toBe('applied');
    const after = await readChange('adventures', 'gone-adventure');
    expect(after).toMatchObject({ deleted: 1, deleted_at: LATER_DELETED_AT });
    expect(after?.seq).toBeGreaterThan(before?.seq ?? Infinity);
  });

  it('skips a table missing from the sync registry and writes nothing', async () => {
    const { create } = await import('@db/paired-device');
    const { getDatabase } = await import('@db/database');
    const { applyDelete } = await import('../apply-delete');
    const { getMaxSeq } = await import('../get-max-seq');
    const deviceId = 'a'.repeat(64);
    await create({ id: deviceId, name: null });
    const seqBefore = await getMaxSeq();

    const result = await applyDelete('paired_devices', deviceId, DELETED_AT);

    expect(result).toBe('skipped');
    const db = await getDatabase();
    expect(
      await db.select<unknown[]>('SELECT id FROM paired_devices'),
    ).toHaveLength(1);
    expect(await getMaxSeq()).toBe(seqBefore);
    expect(await readChange('paired_devices', deviceId)).toBeUndefined();
  });
});
