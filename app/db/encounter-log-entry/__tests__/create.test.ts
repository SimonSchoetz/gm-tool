// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { serializeLogEntryPayload } from '@domain';

vi.mock('@tauri-apps/plugin-sql', async () => {
  const { openTestDatabase } =
    await import('@db/__tests__/support/sqlite-test-database');
  return { default: { load: () => Promise.resolve(openTestDatabase()) } };
});

const CREATED_AT = '2026-01-10T09:00:00.000Z';

const readEntries = async () => {
  const { getDatabase } = await import('@db/database');
  const db = await getDatabase();
  return db.select<unknown[]>('SELECT * FROM encounter_log_entries');
};

const createEncounter = async () => {
  const { create: createAdventure } = await import('@db/adventure');
  const { create } = await import('@db/encounter');
  return create(await createAdventure());
};

describe('create', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(CREATED_AT));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('stores the encounter id, the kind and the serialized payload with equal created_at and updated_at', async () => {
    const { create } = await import('../create');
    const encounterId = await createEncounter();
    const payload = { queueItemIds: ['a', 'b'] };

    const id = await create({
      encounter_id: encounterId,
      kind: 'added',
      payload,
    });

    expect(await readEntries()).toEqual([
      {
        id,
        encounter_id: encounterId,
        kind: 'added',
        payload: serializeLogEntryPayload('added', payload),
        created_at: CREATED_AT,
        updated_at: CREATED_AT,
      },
    ]);
  });

  it('stores a temp-hp entry with its value-field payload serialized under its own kind', async () => {
    const { create } = await import('../create');
    const encounterId = await createEncounter();
    const payload = { targets: [{ queueItemId: 'a', value: 5 }] };

    const id = await create({
      encounter_id: encounterId,
      kind: 'temp-hp',
      payload,
    });

    expect(await readEntries()).toEqual([
      expect.objectContaining({
        id,
        kind: 'temp-hp',
        payload: '{"targets":[{"queueItemId":"a","value":5}]}',
      }),
    ]);
  });

  it('rejects a payload with an empty queueItemIds and stores no row', async () => {
    const { create } = await import('../create');
    const encounterId = await createEncounter();

    await expect(
      create({
        encounter_id: encounterId,
        kind: 'added',
        payload: { queueItemIds: [] },
      }),
    ).rejects.toThrow();

    expect(await readEntries()).toEqual([]);
  });

  it('rejects an empty encounter id and stores no row', async () => {
    const { create } = await import('../create');

    await expect(
      create({
        encounter_id: '',
        kind: 'added',
        payload: { queueItemIds: ['a'] },
      }),
    ).rejects.toThrow(/^Valid Encounter ID is required$/);

    expect(await readEntries()).toEqual([]);
  });
});
