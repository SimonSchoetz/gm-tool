// @vitest-environment node
import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@tauri-apps/plugin-sql', async () => {
  const { openTestDatabase } =
    await import('@db/__tests__/support/sqlite-test-database');
  return { default: { load: () => Promise.resolve(openTestDatabase()) } };
});

describe('getAllByBaseEntity', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("returns only the entity's sections in ascending sort order", async () => {
    const { create: createAdventure } = await import('@db/adventure');
    const { create: createBaseEntity } = await import('@db/base-entity');
    const { create } = await import('../create');
    const { getAllByBaseEntity } = await import('../get-all-by-base-entity');
    const adventureId = await createAdventure();
    const baseEntityId = await createBaseEntity('npcs', adventureId);
    const otherEntityId = await createBaseEntity('npcs', adventureId);
    // Inserted out of sort order, so insertion order and sort order differ.
    const thirdId = await create({
      base_entity_id: baseEntityId,
      type: 'text',
      sort_order: 2,
    });
    const firstId = await create({
      base_entity_id: baseEntityId,
      type: 'text',
      sort_order: 0,
    });
    const secondId = await create({
      base_entity_id: baseEntityId,
      type: 'text',
      sort_order: 1,
    });
    await create({
      base_entity_id: otherEntityId,
      type: 'text',
      sort_order: 0,
    });

    const sections = await getAllByBaseEntity(baseEntityId);

    expect(sections.map((section) => section.id)).toEqual([
      firstId,
      secondId,
      thirdId,
    ]);
  });
});
