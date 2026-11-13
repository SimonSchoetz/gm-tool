// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type {
  CreateEncounterQueueItemInput,
  EncounterQueueItem,
} from '../types';

vi.mock('@tauri-apps/plugin-sql', async () => {
  const { openTestDatabase } =
    await import('@db/__tests__/support/sqlite-test-database');
  return { default: { load: () => Promise.resolve(openTestDatabase()) } };
});

const CREATED_AT = '2026-01-10T09:00:00.000Z';

const readItem = async (id: string) => {
  const { getDatabase } = await import('@db/database');
  const db = await getDatabase();
  const rows = await db.select<EncounterQueueItem[]>(
    'SELECT * FROM encounter_queue_items WHERE id = $1',
    [id],
  );
  return rows[0];
};

const seed = async () => {
  const { create: createAdventure } = await import('@db/adventure');
  const { create: createEncounter } = await import('@db/encounter');
  const { create: createBaseEntity } = await import('@db/base-entity');
  const { createMany } = await import('../create-many');
  const adventureId = await createAdventure();
  const encounterId = await createEncounter(adventureId);
  const otherEncounterId = await createEncounter(adventureId);
  const baseEntityId = await createBaseEntity('foes', adventureId);
  const otherEntityId = await createBaseEntity('foes', adventureId);
  const insert = (row: CreateEncounterQueueItemInput, name?: string) =>
    createMany([row], name !== undefined ? { name } : {});
  return {
    encounterId,
    otherEncounterId,
    baseEntityId,
    otherEntityId,
    insert,
  };
};

describe('append', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(CREATED_AT));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('stores the first item of an encounter at sort order 0 and numbers an entity combatant 1, with its name and starting HP', async () => {
    const { append } = await import('../append');
    const { encounterId, baseEntityId } = await seed();

    const id = await append({
      encounter_id: encounterId,
      kind: 'combatant',
      base_entity_id: baseEntityId,
      name: 'Goblin',
      starting_max_hp: 7,
    });

    expect(await readItem(id)).toMatchObject({
      encounter_id: encounterId,
      kind: 'combatant',
      base_entity_id: baseEntityId,
      name: 'Goblin',
      starting_max_hp: 7,
      sequence_number: 1,
      sort_order: 0,
      created_at: CREATED_AT,
      updated_at: CREATED_AT,
    });
  });

  it('places an item one past the highest sort order of its own encounter, with a gap, whatever another encounter holds', async () => {
    const { append } = await import('../append');
    const { encounterId, otherEncounterId, insert } = await seed();
    await insert({ encounter_id: encounterId, kind: 'event', sort_order: 0 });
    await insert({ encounter_id: encounterId, kind: 'event', sort_order: 5 });
    await insert({
      encounter_id: otherEncounterId,
      kind: 'event',
      sort_order: 9,
    });

    const id = await append({
      encounter_id: encounterId,
      kind: 'event',
      name: 'Lair action',
    });

    expect(await readItem(id)).toMatchObject({ sort_order: 6 });
  });

  it('numbers an entity combatant after the highest sequence number of its entity in its encounter, with a gap, ignoring another entity and another encounter', async () => {
    const { append } = await import('../append');
    const {
      encounterId,
      otherEncounterId,
      baseEntityId,
      otherEntityId,
      insert,
    } = await seed();
    const combatant = (
      encounter_id: string,
      base_entity_id: string,
      sequence_number: number,
    ) =>
      insert({
        encounter_id,
        kind: 'combatant',
        base_entity_id,
        sequence_number,
        sort_order: 0,
      });
    await combatant(encounterId, baseEntityId, 1);
    await combatant(encounterId, baseEntityId, 3);
    await combatant(encounterId, otherEntityId, 9);
    await combatant(otherEncounterId, baseEntityId, 9);

    const id = await append({
      encounter_id: encounterId,
      kind: 'combatant',
      base_entity_id: baseEntityId,
    });

    expect(await readItem(id)).toMatchObject({ sequence_number: 4 });
  });

  it('numbers a random combatant after the highest sequence number among the combatants without an entity and of its name, which a combatant whose entity was deleted counts with', async () => {
    const { append } = await import('../append');
    const { encounterId, otherEncounterId, baseEntityId, insert } =
      await seed();
    const random = (
      encounter_id: string,
      name: string,
      sequence_number: number,
    ) =>
      insert(
        { encounter_id, kind: 'combatant', sequence_number, sort_order: 0 },
        name,
      );
    await random(encounterId, 'Grunt', 1);
    // A combatant whose entity was deleted is stored the same way: no base entity, the entity's name kept.
    await random(encounterId, 'Grunt', 4);
    await random(otherEncounterId, 'Grunt', 9);
    await random(encounterId, 'Brute', 9);
    await random(encounterId, 'grunt', 9);
    await insert(
      {
        encounter_id: encounterId,
        kind: 'combatant',
        base_entity_id: baseEntityId,
        sequence_number: 9,
        sort_order: 0,
      },
      'Grunt',
    );
    await insert(
      { encounter_id: encounterId, kind: 'event', sort_order: 0 },
      'Grunt',
    );

    const id = await append({
      encounter_id: encounterId,
      kind: 'combatant',
      name: 'Grunt',
    });

    expect(await readItem(id)).toMatchObject({
      base_entity_id: null,
      name: 'Grunt',
      starting_max_hp: null,
      sequence_number: 5,
    });
  });

  it('stores an event with its name and no entity, sequence number or starting HP', async () => {
    const { append } = await import('../append');
    const { encounterId } = await seed();

    const id = await append({
      encounter_id: encounterId,
      kind: 'event',
      name: 'Lair action',
    });

    expect(await readItem(id)).toMatchObject({
      kind: 'event',
      name: 'Lair action',
      base_entity_id: null,
      sequence_number: null,
      starting_max_hp: null,
    });
  });

  it('stores an entity combatant without a name or starting HP as null in both', async () => {
    const { append } = await import('../append');
    const { encounterId, baseEntityId } = await seed();

    const id = await append({
      encounter_id: encounterId,
      kind: 'combatant',
      base_entity_id: baseEntityId,
    });

    expect(await readItem(id)).toMatchObject({
      name: null,
      starting_max_hp: null,
    });
  });
});

describe('append input guards', () => {
  it('rejects a blank encounter id or base entity id, naming each in its message', async () => {
    const { append } = await import('../append');

    await expect(
      append({ encounter_id: '', kind: 'event', name: 'x' }),
    ).rejects.toThrow(/^Valid Encounter ID is required$/);
    await expect(
      append({ encounter_id: 'e', kind: 'combatant', base_entity_id: '' }),
    ).rejects.toThrow(/^Valid Base entity ID is required$/);
  });
});
