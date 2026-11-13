// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

vi.mock('@tauri-apps/plugin-sql', async () => {
  const { openTestDatabase } =
    await import('@db/__tests__/support/sqlite-test-database');
  return { default: { load: () => Promise.resolve(openTestDatabase()) } };
});

const CREATED_AT = '2026-01-10T09:00:00.000Z';
const UPDATED_AT = '2026-01-11T09:00:00.000Z';

const readRows = async () => {
  const { getDatabase } = await import('@db/database');
  const db = await getDatabase();
  return db.select<{ id: string; sort_order: number; updated_at: string }[]>(
    'SELECT id, sort_order, updated_at FROM encounter_queue_items ORDER BY created_at, id',
  );
};

const seedRows = async () => {
  const { create: createAdventure } = await import('@db/adventure');
  const { create: createEncounter } = await import('@db/encounter');
  const { createMany } = await import('../create-many');
  const encounterId = await createEncounter(await createAdventure());
  return createMany(
    [0, 1, 2].map((sort_order) => ({
      encounter_id: encounterId,
      kind: 'event' as const,
      sort_order,
    })),
    { name: 'Event' },
  );
};

describe('updateSortOrders', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(CREATED_AT));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('writes each listed row its sort order and a new updated_at, and leaves an unlisted row as it was', async () => {
    const { updateSortOrders } = await import('../update-sort-orders');
    const [first, second, unlisted] = await seedRows();
    const before = await readRows();
    vi.setSystemTime(new Date(UPDATED_AT));

    await updateSortOrders([
      { id: first, sort_order: 1 },
      { id: second, sort_order: 0 },
    ]);

    const after = await readRows();
    expect(after.find((row) => row.id === first)).toEqual({
      id: first,
      sort_order: 1,
      updated_at: UPDATED_AT,
    });
    expect(after.find((row) => row.id === second)).toEqual({
      id: second,
      sort_order: 0,
      updated_at: UPDATED_AT,
    });
    expect(after.find((row) => row.id === unlisted)).toEqual(
      before.find((row) => row.id === unlisted),
    );
  });

  it('writes nothing for an empty list', async () => {
    const { updateSortOrders } = await import('../update-sort-orders');
    await seedRows();
    const before = await readRows();
    vi.setSystemTime(new Date(UPDATED_AT));

    await updateSortOrders([]);

    expect(await readRows()).toEqual(before);
  });
});

describe('updateSortOrders input guards', () => {
  it('rejects a blank id, naming Encounter queue item in its message', async () => {
    const { updateSortOrders } = await import('../update-sort-orders');

    await expect(updateSortOrders([{ id: '', sort_order: 0 }])).rejects.toThrow(
      /^Valid Encounter queue item ID is required$/,
    );
  });
});
