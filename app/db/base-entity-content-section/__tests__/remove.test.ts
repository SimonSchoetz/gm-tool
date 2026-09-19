// @vitest-environment node
import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@tauri-apps/plugin-sql', async () => {
  const { openTestDatabase } =
    await import('@db/__tests__/support/sqlite-test-database');
  return { default: { load: () => Promise.resolve(openTestDatabase()) } };
});

describe('remove', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("removes only the given section and leaves the entity's other section", async () => {
    const { create: createAdventure } = await import('@db/adventure');
    const { create: createBaseEntity } = await import('@db/base-entity');
    const { create } = await import('../create');
    const { remove } = await import('../remove');
    const { getAllByBaseEntity } = await import('../get-all-by-base-entity');
    const baseEntityId = await createBaseEntity(
      'npcs',
      await createAdventure(),
    );
    const removedId = await create({
      base_entity_id: baseEntityId,
      type: 'text',
      sort_order: 0,
    });
    const keptId = await create({
      base_entity_id: baseEntityId,
      type: 'text',
      sort_order: 1,
    });

    await remove(removedId);

    expect(
      (await getAllByBaseEntity(baseEntityId)).map((section) => section.id),
    ).toEqual([keptId]);
  });
});
