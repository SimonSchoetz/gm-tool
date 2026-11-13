// @vitest-environment node
import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { EncounterQueueItem } from '@db/encounter-queue-item';
import type { EncounterLogEntry } from '@db/encounter-log-entry';
import {
  testDatabase,
  writeFailingOnCall,
} from './support/failingDatabaseCall';

// Runs the real encounterQueueService against the real in-memory database; encounterQueueService.test.ts mocks the db modules to test the service's own branching and error wrapping.

vi.mock('@tauri-apps/plugin-sql', async () => {
  const { openTestDatabase } =
    await import('@db/__tests__/support/sqlite-test-database');
  return { default: { load: () => Promise.resolve(openTestDatabase()) } };
});

const load = async () => {
  const encounterQueueService = await import('@services/encounterQueueService');
  const adventureDb = await import('@db/adventure');
  const encounterDb = await import('@db/encounter');
  const baseEntityDb = await import('@db/base-entity');
  const { getDatabase } = await import('@db/database');
  const select = async <T>(sql: string, values: unknown[] = []) =>
    (await getDatabase()).select<T>(sql, values);
  const adventureId = await adventureDb.create();
  return {
    db: await testDatabase(getDatabase),
    encounterQueueService,
    adventureId,
    encounterDb,
    baseEntityDb,
    readQueue: (encounterId: string) =>
      select<EncounterQueueItem[]>(
        'SELECT * FROM encounter_queue_items WHERE encounter_id = $1 ORDER BY sort_order',
        [encounterId],
      ),
    readLog: (encounterId: string) =>
      select<EncounterLogEntry[]>(
        'SELECT * FROM encounter_log_entries WHERE encounter_id = $1',
        [encounterId],
      ),
  };
};

describe('encounterQueueService against the database', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('stores an entity added twice, a random combatant and an event at consecutive sort orders, numbers the entity 1 and 2, and logs one added entry per add naming the stored id', async () => {
    const {
      encounterQueueService,
      adventureId,
      encounterDb,
      baseEntityDb,
      readQueue,
      readLog,
    } = await load();
    const encounterId = await encounterDb.create(adventureId);
    const baseEntityId = await baseEntityDb.create('foes', adventureId);

    await encounterQueueService.addEntityCombatant(
      encounterId,
      'foes',
      baseEntityId,
    );
    await encounterQueueService.addEntityCombatant(
      encounterId,
      'foes',
      baseEntityId,
    );
    await encounterQueueService.addRandomCombatant(encounterId, 'Bandit', 12);
    await encounterQueueService.addEvent(encounterId, 'Bridge collapses');

    const queue = await readQueue(encounterId);
    expect(
      queue.map(({ kind, base_entity_id, sequence_number, sort_order }) => ({
        kind,
        base_entity_id,
        sequence_number,
        sort_order,
      })),
    ).toEqual([
      {
        kind: 'combatant',
        base_entity_id: baseEntityId,
        sequence_number: 1,
        sort_order: 0,
      },
      {
        kind: 'combatant',
        base_entity_id: baseEntityId,
        sequence_number: 2,
        sort_order: 1,
      },
      {
        kind: 'combatant',
        base_entity_id: null,
        sequence_number: 1,
        sort_order: 2,
      },
      {
        kind: 'event',
        base_entity_id: null,
        sequence_number: null,
        sort_order: 3,
      },
    ]);
    const log = await readLog(encounterId);
    expect(log.map((entry) => entry.kind)).toEqual([
      'added',
      'added',
      'added',
      'added',
    ]);
    expect(
      log
        .map(
          (entry) =>
            (JSON.parse(entry.payload) as { queueItemIds: string[] })
              .queueItemIds,
        )
        .sort(),
    ).toEqual(queue.map((item) => [item.id]).sort());
  });

  it('reorders queue items, so a later read returns the requested order', async () => {
    const { encounterQueueService, adventureId, encounterDb, readQueue } =
      await load();
    const encounterId = await encounterDb.create(adventureId);
    await encounterQueueService.addEvent(encounterId, 'First');
    await encounterQueueService.addEvent(encounterId, 'Second');
    await encounterQueueService.addEvent(encounterId, 'Third');
    const [first, second, third] = await readQueue(encounterId);

    await encounterQueueService.reorderQueueItems([
      third.id,
      first.id,
      second.id,
    ]);

    expect((await readQueue(encounterId)).map((item) => item.id)).toEqual([
      third.id,
      first.id,
      second.id,
    ]);
  });

  it('stores items added at the same time at different sort orders, and numbers same-named random combatants 1 and 2', async () => {
    const { encounterQueueService, adventureId, encounterDb, readQueue } =
      await load();
    const encounterId = await encounterDb.create(adventureId);

    await Promise.all([
      encounterQueueService.addRandomCombatant(encounterId, 'Grunt', null),
      encounterQueueService.addRandomCombatant(encounterId, 'Grunt', null),
      encounterQueueService.addEvent(encounterId, 'Lair action'),
    ]);

    const queue = await readQueue(encounterId);
    expect(queue.map((item) => item.sort_order)).toEqual([0, 1, 2]);
    expect(
      queue
        .filter((item) => item.kind === 'combatant')
        .map((item) => item.sequence_number)
        .sort(),
    ).toEqual([1, 2]);
  });

  it('leaves the old order or the whole new one, never a mix, when any database call of a reorder fails', async () => {
    const { encounterQueueService, adventureId, encounterDb, readQueue, db } =
      await load();
    const encounterId = await encounterDb.create(adventureId);
    await encounterQueueService.addEvent(encounterId, 'First');
    await encounterQueueService.addEvent(encounterId, 'Second');
    await encounterQueueService.addEvent(encounterId, 'Third');
    const [first, second, third] = (await readQueue(encounterId)).map(
      (item) => item.id,
    );

    for (const callNumber of [1, 2, 3]) {
      await writeFailingOnCall(db, callNumber, () =>
        encounterQueueService.reorderQueueItems([third, first, second]),
      );
      const queue = await readQueue(encounterId);
      expect([
        [first, second, third],
        [third, first, second],
      ]).toContainEqual(queue.map((item) => item.id));
      expect(queue.map((item) => item.sort_order)).toEqual([0, 1, 2]);
      await encounterQueueService.reorderQueueItems([first, second, third]);
    }
  });
});
