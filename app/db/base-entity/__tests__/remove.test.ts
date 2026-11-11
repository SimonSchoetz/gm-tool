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

  it('keeps the queue items that named the entity, now without a base entity and with their name unchanged', async () => {
    const { create: createAdventure } = await import('@db/adventure');
    const { create: createEncounter } = await import('@db/encounter');
    const { createMany } = await import('@db/encounter-queue-item');
    const { create } = await import('../create');
    const { remove } = await import('../remove');
    const { getDatabase } = await import('@db/database');
    const adventureId = await createAdventure();
    const encounterId = await createEncounter(adventureId);
    const removedId = await create('foes', adventureId);
    const keptId = await create('foes', adventureId);
    const queueItem = (baseEntityId: string, sortOrder: number) => ({
      encounter_id: encounterId,
      kind: 'combatant' as const,
      base_entity_id: baseEntityId,
      sequence_number: 1,
      sort_order: sortOrder,
    });
    await createMany([queueItem(removedId, 0)], { name: 'Goblin' });
    await createMany([queueItem(keptId, 1)], { name: 'Orc' });

    await remove(removedId);

    const db = await getDatabase();
    expect(
      await db.select<{ base_entity_id: string | null; name: string }[]>(
        'SELECT base_entity_id, name FROM encounter_queue_items ORDER BY sort_order',
      ),
    ).toEqual([
      { base_entity_id: null, name: 'Goblin' },
      { base_entity_id: keptId, name: 'Orc' },
    ]);
  });
});

describe('remove input guards', () => {
  it('rejects a blank id, naming Base entity in its message', async () => {
    const { remove } = await import('../remove');

    await expect(remove('')).rejects.toThrow(
      /^Valid Base entity ID is required$/,
    );
  });
});
