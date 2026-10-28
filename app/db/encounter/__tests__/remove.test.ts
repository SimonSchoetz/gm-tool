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

  it("removes the encounter and leaves the adventure's other encounter", async () => {
    const { create: createAdventure } = await import('@db/adventure');
    const { create } = await import('../create');
    const { remove } = await import('../remove');
    const { getAll } = await import('../get-all');
    const adventureId = await createAdventure();
    const removedId = await create(adventureId);
    const keptId = await create(adventureId);

    await remove(removedId);

    expect(
      (await getAll(adventureId)).map((encounter) => encounter.id),
    ).toEqual([keptId]);
  });

  it("removes the encounter's queue items and log entries and leaves another encounter's", async () => {
    const { create: createAdventure } = await import('@db/adventure');
    const { create: createBaseEntity } = await import('@db/base-entity');
    const { createMany } = await import('@db/encounter-queue-item');
    const { create: createLogEntry } = await import('@db/encounter-log-entry');
    const { create } = await import('../create');
    const { remove } = await import('../remove');
    const { getDatabase } = await import('@db/database');
    const adventureId = await createAdventure();
    const removedId = await create(adventureId);
    const keptId = await create(adventureId);
    const baseEntityId = await createBaseEntity('foes', adventureId);
    for (const encounterId of [removedId, keptId]) {
      const queueItemIds = await createMany([
        {
          encounter_id: encounterId,
          kind: 'combatant',
          base_entity_id: baseEntityId,
          sequence_number: 1,
          sort_order: 0,
        },
      ]);
      await createLogEntry({
        encounter_id: encounterId,
        kind: 'added',
        payload: { queueItemIds },
      });
    }

    await remove(removedId);

    const db = await getDatabase();
    expect(
      await db.select<{ encounter_id: string }[]>(
        'SELECT encounter_id FROM encounter_queue_items',
      ),
    ).toEqual([{ encounter_id: keptId }]);
    expect(
      await db.select<{ encounter_id: string }[]>(
        'SELECT encounter_id FROM encounter_log_entries',
      ),
    ).toEqual([{ encounter_id: keptId }]);
  });
});
