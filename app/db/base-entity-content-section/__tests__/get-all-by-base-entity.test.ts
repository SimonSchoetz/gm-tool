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
    const { update } = await import('../update');
    const { getAllByBaseEntity } = await import('../get-all-by-base-entity');
    const adventureId = await createAdventure();
    const baseEntityId = await createBaseEntity('npcs', adventureId);
    const otherEntityId = await createBaseEntity('npcs', adventureId);
    // Moved out of insertion order, so insertion order and sort order differ.
    const thirdId = await create({
      base_entity_id: baseEntityId,
      type: 'text',
    });
    const firstId = await create({
      base_entity_id: baseEntityId,
      type: 'text',
    });
    const secondId = await create({
      base_entity_id: baseEntityId,
      type: 'text',
    });
    await update(thirdId, { sort_order: 2 });
    await update(firstId, { sort_order: 0 });
    await update(secondId, { sort_order: 1 });
    await create({ base_entity_id: otherEntityId, type: 'text' });

    const sections = await getAllByBaseEntity(baseEntityId);

    expect(sections.map((section) => section.id)).toEqual([
      firstId,
      secondId,
      thirdId,
    ]);
  });
});

describe('getAllByBaseEntity input guards', () => {
  it('rejects a blank id, naming Base entity in its message', async () => {
    const { getAllByBaseEntity } = await import('../get-all-by-base-entity');

    await expect(getAllByBaseEntity('')).rejects.toThrow(
      /^Valid Base entity ID is required$/,
    );
  });
});
