// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { EncounterQueueItem } from '../types';

vi.mock('@tauri-apps/plugin-sql', async () => {
  const { openTestDatabase } =
    await import('@db/__tests__/support/sqlite-test-database');
  return { default: { load: () => Promise.resolve(openTestDatabase()) } };
});

const CREATED_AT = '2026-01-10T09:00:00.000Z';

const readItems = async () => {
  const { getDatabase } = await import('@db/database');
  const db = await getDatabase();
  return db.select<EncounterQueueItem[]>(
    'SELECT * FROM encounter_queue_items ORDER BY sort_order ASC',
  );
};

const seedEncounterAndEntity = async () => {
  const { create: createAdventure } = await import('@db/adventure');
  const { create: createEncounter } = await import('@db/encounter');
  const { create: createBaseEntity } = await import('@db/base-entity');
  const adventureId = await createAdventure();
  return {
    encounterId: await createEncounter(adventureId),
    baseEntityId: await createBaseEntity('foes', adventureId),
  };
};

describe('createMany', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(CREATED_AT));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('stores every row with the encounter, kind, base entity, sequence number and sort order it was given and returns the ids in input order', async () => {
    const { createMany } = await import('../create-many');
    const { encounterId, baseEntityId } = await seedEncounterAndEntity();

    const ids = await createMany([
      {
        encounter_id: encounterId,
        kind: 'combatant',
        base_entity_id: baseEntityId,
        sequence_number: 4,
        sort_order: 7,
      },
      {
        encounter_id: encounterId,
        kind: 'combatant',
        base_entity_id: baseEntityId,
        sequence_number: 5,
        sort_order: 8,
      },
    ]);

    expect(ids).toHaveLength(2);
    expect(await readItems()).toEqual([
      {
        id: ids[0],
        encounter_id: encounterId,
        kind: 'combatant',
        base_entity_id: baseEntityId,
        name: null,
        custom_name: null,
        notes: null,
        sequence_number: 4,
        starting_max_hp: null,
        sort_order: 7,
        created_at: CREATED_AT,
        updated_at: CREATED_AT,
      },
      {
        id: ids[1],
        encounter_id: encounterId,
        kind: 'combatant',
        base_entity_id: baseEntityId,
        name: null,
        custom_name: null,
        notes: null,
        sequence_number: 5,
        starting_max_hp: null,
        sort_order: 8,
        created_at: CREATED_AT,
        updated_at: CREATED_AT,
      },
    ]);
  });

  it('stores the shared name and starting max HP in every row of the batch', async () => {
    const { createMany } = await import('../create-many');
    const { encounterId, baseEntityId } = await seedEncounterAndEntity();

    await createMany(
      [0, 1].map((sortOrder) => ({
        encounter_id: encounterId,
        kind: 'combatant' as const,
        base_entity_id: baseEntityId,
        sequence_number: sortOrder + 1,
        sort_order: sortOrder,
      })),
      { name: 'Goblin', starting_max_hp: 0 },
    );

    expect(await readItems()).toMatchObject([
      { name: 'Goblin', starting_max_hp: 0 },
      { name: 'Goblin', starting_max_hp: 0 },
    ]);
  });

  it('stores a batch of random combatants with no entity, the given sequence numbers, the shared name and the shared HP', async () => {
    const { createMany } = await import('../create-many');
    const { encounterId } = await seedEncounterAndEntity();

    const ids = await createMany(
      [0, 1].map((index) => ({
        encounter_id: encounterId,
        kind: 'combatant' as const,
        sequence_number: index + 3,
        sort_order: index + 5,
      })),
      { name: 'Grunt', starting_max_hp: 10 },
    );

    expect(await readItems()).toEqual([
      {
        id: ids[0],
        encounter_id: encounterId,
        kind: 'combatant',
        base_entity_id: null,
        name: 'Grunt',
        custom_name: null,
        notes: null,
        sequence_number: 3,
        starting_max_hp: 10,
        sort_order: 5,
        created_at: CREATED_AT,
        updated_at: CREATED_AT,
      },
      {
        id: ids[1],
        encounter_id: encounterId,
        kind: 'combatant',
        base_entity_id: null,
        name: 'Grunt',
        custom_name: null,
        notes: null,
        sequence_number: 4,
        starting_max_hp: 10,
        sort_order: 6,
        created_at: CREATED_AT,
        updated_at: CREATED_AT,
      },
    ]);
  });

  it('stores an event with no entity link and no sequence number', async () => {
    const { createMany } = await import('../create-many');
    const { encounterId } = await seedEncounterAndEntity();

    const [id] = await createMany(
      [{ encounter_id: encounterId, kind: 'event', sort_order: 2 }],
      { name: 'Lair action' },
    );

    expect(await readItems()).toEqual([
      {
        id,
        encounter_id: encounterId,
        kind: 'event',
        base_entity_id: null,
        name: 'Lair action',
        custom_name: null,
        notes: null,
        sequence_number: null,
        starting_max_hp: null,
        sort_order: 2,
        created_at: CREATED_AT,
        updated_at: CREATED_AT,
      },
    ]);
  });

  it.each([
    ['encounter', { encounter_id: '' }, /^Valid Encounter ID is required$/],
    [
      'base entity',
      { base_entity_id: '' },
      /^Valid Base entity ID is required$/,
    ],
  ])(
    'rejects a row without a %s id and stores nothing',
    async (_, override, message) => {
      const { createMany } = await import('../create-many');
      const { encounterId, baseEntityId } = await seedEncounterAndEntity();

      await expect(
        createMany([
          {
            encounter_id: encounterId,
            kind: 'combatant',
            base_entity_id: baseEntityId,
            sequence_number: 1,
            sort_order: 0,
            ...override,
          },
        ]),
      ).rejects.toThrow(message);

      expect(await readItems()).toEqual([]);
    },
  );
});
