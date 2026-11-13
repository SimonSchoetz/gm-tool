// @vitest-environment node
import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Encounter } from '@db/encounter';
import type { EncounterQueueItem } from '@db/encounter-queue-item';

// Runs the real encounterService and encounterQueueService against the real in-memory database, with only the image file commands answered by a stand-in; encounterService.test.ts mocks the db modules to test the service's own branching and error wrapping.

vi.mock('@tauri-apps/plugin-sql', async () => {
  const { openTestDatabase } =
    await import('@db/__tests__/support/sqlite-test-database');
  return { default: { load: () => Promise.resolve(openTestDatabase()) } };
});

vi.mock('@tauri-apps/api/core', async () => {
  const { answerHostCommand } = await import('./support/hostCommands');
  return { invoke: answerHostCommand };
});

const load = async () => {
  const encounterService = await import('@services/encounterService');
  const encounterQueueService = await import('@services/encounterQueueService');
  const adventureDb = await import('@db/adventure');
  const encounterDb = await import('@db/encounter');
  const logEntryDb = await import('@db/encounter-log-entry');
  const imageDb = await import('@db/image');
  const { getDatabase } = await import('@db/database');
  const select = async <T>(sql: string, values: unknown[] = []) =>
    (await getDatabase()).select<T>(sql, values);
  const adventureId = await adventureDb.create();
  const createImagedEncounter = async () => {
    const encounterId = await encounterDb.create(adventureId);
    const imageId = await imageDb.create({ filePath: '/pics/cover.png' });
    await encounterDb.update(encounterId, { image_id: imageId });
    return { encounterId, imageId };
  };
  return {
    encounterService,
    encounterQueueService,
    logEntryDb,
    createImagedEncounter,
    readImageIds: async () =>
      (await select<{ id: string }[]>('SELECT id FROM images')).map(
        (row) => row.id,
      ),
    readEncounterIds: async () =>
      (await select<{ id: string }[]>('SELECT id FROM encounters')).map(
        (row) => row.id,
      ),
    readEncounter: async (id: string) =>
      (
        await select<Encounter[]>('SELECT * FROM encounters WHERE id = $1', [
          id,
        ])
      )[0],
    readQueue: (encounterId: string) =>
      select<EncounterQueueItem[]>(
        'SELECT * FROM encounter_queue_items WHERE encounter_id = $1 ORDER BY sort_order',
        [encounterId],
      ),
  };
};

describe('encounterService against the database', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('duplicates an encounter with every queue item its log did not remove, each starting at the derived max HP', async () => {
    const {
      encounterService,
      encounterQueueService,
      logEntryDb,
      createImagedEncounter,
      readEncounter,
      readQueue,
    } = await load();
    const { encounterId, imageId } = await createImagedEncounter();
    await encounterQueueService.addRandomCombatant(encounterId, 'Orc', 10);
    await encounterQueueService.addRandomCombatant(encounterId, 'Ogre', 30);
    await encounterQueueService.addRandomCombatant(encounterId, 'Goblin', 7);
    await encounterQueueService.addEvent(encounterId, 'Reinforcements');
    const [edited, removed, unedited, event] = await readQueue(encounterId);
    await logEntryDb.create({
      encounter_id: encounterId,
      kind: 'max-hp',
      payload: { targets: [{ queueItemId: edited.id, value: 15 }] },
    });
    await logEntryDb.create({
      encounter_id: encounterId,
      kind: 'removed',
      payload: { queueItemIds: [removed.id] },
    });

    const copyId = await encounterService.duplicateEncounter(encounterId);

    const copyQueue = await readQueue(copyId);
    expect(
      copyQueue.map(({ kind, name, sort_order, starting_max_hp }) => ({
        kind,
        name,
        sort_order,
        starting_max_hp,
      })),
    ).toEqual([
      {
        kind: 'combatant',
        name: 'Orc',
        sort_order: edited.sort_order,
        starting_max_hp: 15,
      },
      {
        kind: 'combatant',
        name: 'Goblin',
        sort_order: unedited.sort_order,
        starting_max_hp: 7,
      },
      {
        kind: 'event',
        name: 'Reinforcements',
        sort_order: event.sort_order,
        starting_max_hp: null,
      },
    ]);
    const sourceIds = [edited.id, removed.id, unedited.id, event.id];
    expect(copyQueue.filter((item) => sourceIds.includes(item.id))).toEqual([]);
    expect((await readEncounter(copyId)).image_id).not.toBe(imageId);
  });

  it('deletes an encounter together with its image row, leaving another encounter and its image', async () => {
    const {
      encounterService,
      createImagedEncounter,
      readImageIds,
      readEncounterIds,
    } = await load();
    const deleted = await createImagedEncounter();
    const kept = await createImagedEncounter();

    await encounterService.deleteEncounter(deleted.encounterId);

    expect(await readEncounterIds()).toEqual([kept.encounterId]);
    expect(await readImageIds()).toEqual([kept.imageId]);
  });

  it('replaces an encounter’s image, pointing it at the new image row and removing the old one', async () => {
    const {
      encounterService,
      createImagedEncounter,
      readImageIds,
      readEncounter,
    } = await load();
    const { encounterId, imageId } = await createImagedEncounter();

    await encounterService.updateEncounter(encounterId, {
      image_id: imageId,
      imgFilePath: '/pics/new-cover.jpg',
    });

    const { image_id: newImageId } = await readEncounter(encounterId);
    expect(newImageId).not.toBe(imageId);
    expect(await readImageIds()).toEqual([newImageId]);
  });

  it('removes an encounter’s image, deleting the image row and emptying its image_id', async () => {
    const {
      encounterService,
      createImagedEncounter,
      readImageIds,
      readEncounter,
    } = await load();
    const removed = await createImagedEncounter();
    const kept = await createImagedEncounter();

    await encounterService.removeEncounterImage(removed.encounterId);

    expect((await readEncounter(removed.encounterId)).image_id).toBeNull();
    expect(await readImageIds()).toEqual([kept.imageId]);
  });
});
