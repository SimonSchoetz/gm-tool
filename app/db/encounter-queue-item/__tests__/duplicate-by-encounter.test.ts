// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { EncounterQueueItem } from '../types';

vi.mock('@tauri-apps/plugin-sql', async () => {
  const { openTestDatabase } =
    await import('@db/__tests__/support/sqlite-test-database');
  return { default: { load: () => Promise.resolve(openTestDatabase()) } };
});

const T1 = '2026-01-10T09:00:00.000Z';
const T2 = '2026-01-11T09:00:00.000Z';

const readItems = async (encounterId: string) => {
  const { getDatabase } = await import('@db/database');
  const db = await getDatabase();
  return db.select<EncounterQueueItem[]>(
    'SELECT * FROM encounter_queue_items WHERE encounter_id = $1 ORDER BY sort_order ASC',
    [encounterId],
  );
};

// Every copied column holds a non-default value on the source, and the sort orders 7, 2 and 4 are not array positions, so a copy that drops a column or re-derives the order shows.
const seedSourceAndEmptyTarget = async () => {
  const { create: createAdventure } = await import('@db/adventure');
  const { create: createEncounter } = await import('@db/encounter');
  const { create: createBaseEntity } = await import('@db/base-entity');
  const { createMany } = await import('../create-many');
  const { update } = await import('../update');
  const adventureId = await createAdventure();
  const sourceEncounterId = await createEncounter(adventureId);
  const targetEncounterId = await createEncounter(adventureId);
  const baseEntityId = await createBaseEntity('foes', adventureId);
  const [entityItemId] = await createMany(
    [
      {
        encounter_id: sourceEncounterId,
        kind: 'combatant',
        base_entity_id: baseEntityId,
        sequence_number: 2,
        sort_order: 7,
      },
    ],
    { name: 'Goblin', starting_max_hp: 7 },
  );
  const [randomItemId] = await createMany(
    [
      {
        encounter_id: sourceEncounterId,
        kind: 'combatant',
        sequence_number: 1,
        sort_order: 2,
      },
    ],
    { name: 'Grunt', starting_max_hp: 10 },
  );
  const [eventItemId] = await createMany(
    [{ encounter_id: sourceEncounterId, kind: 'event', sort_order: 4 }],
    { name: 'Lair action' },
  );
  const [removedItemId] = await createMany(
    [
      {
        encounter_id: sourceEncounterId,
        kind: 'combatant',
        sequence_number: 3,
        sort_order: 9,
      },
    ],
    { name: 'Gone', starting_max_hp: 1 },
  );
  await update(entityItemId, { custom_name: 'Big Goblin', notes: 'n1' });
  await update(eventItemId, { notes: 'n3' });
  return {
    sourceEncounterId,
    targetEncounterId,
    entityItemId,
    randomItemId,
    eventItemId,
    removedItemId,
    baseEntityId,
  };
};

describe('duplicateByEncounter', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(T1));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('copies an entity combatant, a random combatant and an event with the same columns, new ids and fresh timestamps', async () => {
    const { duplicateByEncounter } = await import('../duplicate-by-encounter');
    const seed = await seedSourceAndEmptyTarget();
    const sourceIds = (await readItems(seed.sourceEncounterId)).map(
      (item) => item.id,
    );
    vi.setSystemTime(new Date(T2));

    await duplicateByEncounter(
      seed.sourceEncounterId,
      seed.targetEncounterId,
      new Map([
        [seed.entityItemId, 7],
        [seed.randomItemId, 10],
        [seed.eventItemId, null],
      ]),
    );

    const copies = await readItems(seed.targetEncounterId);
    expect(copies.map(({ id: _id, ...columns }) => columns)).toEqual([
      {
        encounter_id: seed.targetEncounterId,
        kind: 'combatant',
        base_entity_id: null,
        name: 'Grunt',
        custom_name: null,
        notes: null,
        sequence_number: 1,
        starting_max_hp: 10,
        sort_order: 2,
        created_at: T2,
        updated_at: T2,
      },
      {
        encounter_id: seed.targetEncounterId,
        kind: 'event',
        base_entity_id: null,
        name: 'Lair action',
        custom_name: null,
        notes: 'n3',
        sequence_number: null,
        starting_max_hp: null,
        sort_order: 4,
        created_at: T2,
        updated_at: T2,
      },
      {
        encounter_id: seed.targetEncounterId,
        kind: 'combatant',
        base_entity_id: seed.baseEntityId,
        name: 'Goblin',
        custom_name: 'Big Goblin',
        notes: 'n1',
        sequence_number: 2,
        starting_max_hp: 7,
        sort_order: 7,
        created_at: T2,
        updated_at: T2,
      },
    ]);
    for (const copy of copies) {
      expect(sourceIds).not.toContain(copy.id);
    }
  });

  it("writes each copy's starting max HP from the map, not the stored value", async () => {
    const { duplicateByEncounter } = await import('../duplicate-by-encounter');
    const seed = await seedSourceAndEmptyTarget();

    await duplicateByEncounter(
      seed.sourceEncounterId,
      seed.targetEncounterId,
      new Map([
        [seed.entityItemId, 12],
        [seed.randomItemId, null],
        [seed.eventItemId, null],
      ]),
    );

    expect(
      (await readItems(seed.targetEncounterId)).map((copy) => [
        copy.name,
        copy.starting_max_hp,
      ]),
    ).toEqual([
      ['Grunt', null],
      ['Lair action', null],
      ['Goblin', 12],
    ]);
  });

  it('copies only the items in the map and leaves every source row where it was', async () => {
    const { duplicateByEncounter } = await import('../duplicate-by-encounter');
    const seed = await seedSourceAndEmptyTarget();
    const sourceBefore = await readItems(seed.sourceEncounterId);

    await duplicateByEncounter(
      seed.sourceEncounterId,
      seed.targetEncounterId,
      new Map([[seed.randomItemId, 10]]),
    );

    expect(
      (await readItems(seed.targetEncounterId)).map((copy) => copy.name),
    ).toEqual(['Grunt']);
    expect(await readItems(seed.sourceEncounterId)).toEqual(sourceBefore);
  });

  it.each([
    ['source', true],
    ['target', false],
  ])(
    'rejects an empty %s encounter id and copies nothing',
    async (_label, emptySource) => {
      const { duplicateByEncounter } =
        await import('../duplicate-by-encounter');
      const seed = await seedSourceAndEmptyTarget();

      await expect(
        duplicateByEncounter(
          emptySource ? '' : seed.sourceEncounterId,
          emptySource ? seed.targetEncounterId : '',
          new Map([[seed.randomItemId, 10]]),
        ),
      ).rejects.toThrow(/^Valid Encounter ID is required$/);

      expect(await readItems(seed.targetEncounterId)).toEqual([]);
    },
  );
});
