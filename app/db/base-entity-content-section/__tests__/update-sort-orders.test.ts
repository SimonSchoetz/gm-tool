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
    'SELECT id, sort_order, updated_at FROM base_entity_content_sections ORDER BY created_at, id',
  );
};

const seedRows = async () => {
  const { create: createAdventure } = await import('@db/adventure');
  const { create: createBaseEntity } = await import('@db/base-entity');
  const { create } = await import('../create');
  const baseEntityId = await createBaseEntity('npcs', await createAdventure());
  const ids: string[] = [];
  for (let index = 0; index < 3; index++) {
    ids.push(await create({ base_entity_id: baseEntityId, type: 'text' }));
  }
  return ids;
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
  it('rejects a blank id, naming Base entity content section in its message', async () => {
    const { updateSortOrders } = await import('../update-sort-orders');

    await expect(updateSortOrders([{ id: '', sort_order: 0 }])).rejects.toThrow(
      /^Valid Base entity content section ID is required$/,
    );
  });
});
