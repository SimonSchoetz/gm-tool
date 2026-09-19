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

  it('deletes the entity and its content sections and leaves another entity and its sections', async () => {
    const { create: createAdventure } = await import('@db/adventure');
    const { create: createSection } =
      await import('@db/base-entity-content-section');
    const { create } = await import('../create');
    const { remove } = await import('../remove');
    const { getAll } = await import('../get-all');
    const { getDatabase } = await import('@db/database');
    const adventureId = await createAdventure();
    const removedId = await create('npcs', adventureId);
    const keptId = await create('npcs', adventureId);
    await createSection({
      base_entity_id: removedId,
      type: 'text',
      sort_order: 0,
    });
    await createSection({
      base_entity_id: keptId,
      type: 'text',
      sort_order: 0,
    });

    await remove(removedId);

    expect((await getAll('npcs', adventureId)).map((npc) => npc.id)).toEqual([
      keptId,
    ]);
    const db = await getDatabase();
    expect(
      await db.select<{ base_entity_id: string }[]>(
        'SELECT base_entity_id FROM base_entity_content_sections',
      ),
    ).toEqual([{ base_entity_id: keptId }]);
  });
});
