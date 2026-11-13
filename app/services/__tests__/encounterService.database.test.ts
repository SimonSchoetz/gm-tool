// @vitest-environment node
import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Encounter } from '@db/encounter';
import type { EncounterQueueItem } from '@db/encounter-queue-item';
import {
  testDatabase,
  writeFailingOnEachCall,
} from './support/failingDatabaseCall';
import {
  answerHostCommand,
  answerHostCommandFailing,
} from './support/hostCommands';

// Runs the real encounterService and encounterQueueService against the real in-memory database, with only the image file commands answered by a stand-in; encounterService.test.ts mocks the db modules to test the service's own branching and error wrapping.

vi.mock('@tauri-apps/plugin-sql', async () => {
  const { openTestDatabase } =
    await import('@db/__tests__/support/sqlite-test-database');
  return { default: { load: () => Promise.resolve(openTestDatabase()) } };
});

const invoke = vi.hoisted(() => vi.fn<(command: string) => Promise<unknown>>());
vi.mock('@tauri-apps/api/core', () => ({ invoke }));

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
    db: await testDatabase(getDatabase),
    countQueueItems: async () =>
      (
        await select<{ count: number }[]>(
          'SELECT COUNT(*) AS count FROM encounter_queue_items',
        )
      )[0].count,
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
    invoke.mockReset().mockImplementation(answerHostCommand);
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

  it('leaves no copy and no copied queue item behind when any database call of a duplication fails', async () => {
    const {
      encounterService,
      encounterQueueService,
      createImagedEncounter,
      readEncounterIds,
      countQueueItems,
      db,
    } = await load();
    const { encounterId } = await createImagedEncounter();
    await encounterQueueService.addRandomCombatant(encounterId, 'Orc', 10);
    await encounterQueueService.addEvent(encounterId, 'Reinforcements');

    await writeFailingOnEachCall(
      db,
      () => encounterService.duplicateEncounter(encounterId),
      async () => {
        // The source and the counting run's copy, each with its two queue items.
        expect(await readEncounterIds()).toHaveLength(2);
        expect(await countQueueItems()).toBe(4);
      },
    );
  });

  it('keeps the encounter pointing at a stored image, the old or the new, when any database call of an image replacement fails', async () => {
    const {
      encounterService,
      createImagedEncounter,
      readImageIds,
      readEncounter,
      db,
    } = await load();
    const { encounterId } = await createImagedEncounter();

    await writeFailingOnEachCall(
      db,
      async () => {
        const { image_id } = await readEncounter(encounterId);
        await encounterService.updateEncounter(encounterId, {
          image_id,
          imgFilePath: '/pics/new-image.jpg',
        });
      },
      async () => {
        const { image_id } = await readEncounter(encounterId);
        expect(await readImageIds()).toContain(image_id);
      },
    );
  });

  it('resolves with the encounter on the new image, the old image row kept for the cleanup, when the old image’s file cannot be deleted', async () => {
    const {
      encounterService,
      createImagedEncounter,
      readImageIds,
      readEncounter,
    } = await load();
    const { encounterId, imageId } = await createImagedEncounter();
    invoke.mockImplementation(answerHostCommandFailing('delete_image'));

    await encounterService.updateEncounter(encounterId, {
      image_id: imageId,
      imgFilePath: '/pics/new-image.jpg',
    });

    const { image_id: newImageId } = await readEncounter(encounterId);
    expect(newImageId).not.toBeNull();
    expect(newImageId).not.toBe(imageId);
    expect(await readImageIds()).toContain(imageId);
  });

  it('resolves with the encounter’s image emptied when the image’s file cannot be deleted', async () => {
    const { encounterService, createImagedEncounter, readEncounter } =
      await load();
    const { encounterId } = await createImagedEncounter();
    invoke.mockImplementation(answerHostCommandFailing('delete_image'));

    await encounterService.removeEncounterImage(encounterId);

    expect((await readEncounter(encounterId)).image_id).toBeNull();
  });

  it('leaves the encounter either gone or still naming its image, when any database call of its deletion fails', async () => {
    const {
      encounterService,
      createImagedEncounter,
      readImageIds,
      readEncounter,
      readEncounterIds,
      db,
    } = await load();
    let encounterId = '';

    await writeFailingOnEachCall(
      db,
      () => encounterService.deleteEncounter(encounterId),
      async () => {
        if ((await readEncounterIds()).includes(encounterId)) {
          const { image_id } = await readEncounter(encounterId);
          expect(await readImageIds()).toContain(image_id);
        }
      },
      async () => {
        ({ encounterId } = await createImagedEncounter());
      },
    );
  });

  it('resolves with the encounter gone when its image’s file cannot be deleted', async () => {
    const { encounterService, createImagedEncounter, readEncounterIds } =
      await load();
    const { encounterId } = await createImagedEncounter();
    invoke.mockImplementation(answerHostCommandFailing('delete_image'));

    await encounterService.deleteEncounter(encounterId);

    expect(await readEncounterIds()).not.toContain(encounterId);
  });
});
