// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { BaseEntityContentSection } from '../types';

vi.mock('@tauri-apps/plugin-sql', async () => {
  const { openTestDatabase } =
    await import('@db/__tests__/support/sqlite-test-database');
  return { default: { load: () => Promise.resolve(openTestDatabase()) } };
});

const T1 = '2026-01-10T09:00:00.000Z';
const T2 = '2026-01-11T09:00:00.000Z';

const readSections = async (baseEntityId: string) => {
  const { getDatabase } = await import('@db/database');
  const db = await getDatabase();
  return db.select<BaseEntityContentSection[]>(
    'SELECT * FROM base_entity_content_sections WHERE base_entity_id = $1 ORDER BY sort_order',
    [baseEntityId],
  );
};

// Sort orders 7 and 3 are not array positions and the two sections differ in type, so a copy that re-derives the order or drops a column shows. Every copied column holds a non-default value on the source.
const seedSourceAndEmptyTarget = async () => {
  const { create: createAdventure } = await import('@db/adventure');
  const { create: createBaseEntity } = await import('@db/base-entity');
  const { create } = await import('../create');
  const { update } = await import('../update');
  const adventureId = await createAdventure();
  const sourceEntityId = await createBaseEntity('npcs', adventureId);
  const targetEntityId = await createBaseEntity('npcs', adventureId);
  const first = await create({
    base_entity_id: sourceEntityId,
    type: 'text',
    sort_order: 7,
    name: 'Section A',
  });
  const second = await create({
    base_entity_id: sourceEntityId,
    type: '5e-stat-block',
    sort_order: 3,
    name: 'Section B',
  });
  await update(first, { content: 'c', checked: 1 });
  await update(second, { content: 'c', checked: 1 });
  return { sourceEntityId, targetEntityId };
};

describe('duplicateByBaseEntity', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(T1));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('copies every section to the target entity under a fresh id with the same columns and new timestamps', async () => {
    const { duplicateByBaseEntity } =
      await import('../duplicate-by-base-entity');
    const { sourceEntityId, targetEntityId } = await seedSourceAndEmptyTarget();
    const sourceIds = (await readSections(sourceEntityId)).map(
      (section) => section.id,
    );
    vi.setSystemTime(new Date(T2));

    await duplicateByBaseEntity(sourceEntityId, targetEntityId);

    const copies = await readSections(targetEntityId);
    expect(copies.map(({ id: _id, ...columns }) => columns)).toEqual([
      {
        base_entity_id: targetEntityId,
        name: 'Section B',
        type: '5e-stat-block',
        content: 'c',
        checked: 1,
        sort_order: 3,
        created_at: T2,
        updated_at: T2,
      },
      {
        base_entity_id: targetEntityId,
        name: 'Section A',
        type: 'text',
        content: 'c',
        checked: 1,
        sort_order: 7,
        created_at: T2,
        updated_at: T2,
      },
    ]);
    for (const copy of copies) {
      expect(sourceIds).not.toContain(copy.id);
    }
  });

  it("leaves the source entity's sections unchanged", async () => {
    const { duplicateByBaseEntity } =
      await import('../duplicate-by-base-entity');
    const { sourceEntityId, targetEntityId } = await seedSourceAndEmptyTarget();
    const before = await readSections(sourceEntityId);
    vi.setSystemTime(new Date(T2));

    await duplicateByBaseEntity(sourceEntityId, targetEntityId);

    expect(await readSections(sourceEntityId)).toEqual(before);
  });
});
