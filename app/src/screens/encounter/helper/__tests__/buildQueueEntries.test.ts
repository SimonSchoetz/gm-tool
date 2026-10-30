import { describe, it, expect } from 'vitest';
import {
  BASE_ENTITY_ID,
  buildBaseEntity,
} from '@/__tests__/support/buildBaseEntity';
import { buildEncounterLogEntry } from '@/__tests__/support/buildEncounterLogEntry';
import { buildEncounterQueueItem } from '@/__tests__/support/buildEncounterQueueItem';
import { buildQueueEntries, type CombatantEntry } from '../buildQueueEntries';

// The cases below read combatant-only fields of an entry, so they narrow to the combatant variant first.
const buildCombatantEntries = (
  ...args: Parameters<typeof buildQueueEntries>
): CombatantEntry[] =>
  buildQueueEntries(...args).filter(
    (entry): entry is CombatantEntry => entry.kind === 'combatant',
  );

describe('buildQueueEntries', () => {
  it('keeps the order of the queue items', () => {
    const entries = buildCombatantEntries(
      [
        buildEncounterQueueItem({ id: 'b', sort_order: 1 }),
        buildEncounterQueueItem({ id: 'a', sort_order: 0 }),
      ],
      [],
      [buildBaseEntity()],
      false,
    );

    expect(entries.map((entry) => entry.id)).toEqual(['b', 'a']);
  });

  it("shows the entity's current name and image after a rename", () => {
    const [entry] = buildCombatantEntries(
      [buildEncounterQueueItem({ id: 'a', name: 'Old Name' })],
      [],
      [buildBaseEntity({ name: 'Renamed', image_id: 'image-9' })],
      false,
    );

    expect(entry).toMatchObject({ name: 'Renamed', imageId: 'image-9' });
  });

  it('keeps the stored name and has no image for a combatant of a deleted entity', () => {
    const [entry] = buildCombatantEntries(
      [buildEncounterQueueItem({ id: 'a', name: 'Stored' })],
      [],
      [],
      false,
    );

    expect(entry).toMatchObject({ name: 'Stored', imageId: null });
  });

  it('has no image for a combatant without a base entity', () => {
    const [entry] = buildCombatantEntries(
      [buildEncounterQueueItem({ id: 'a', base_entity_id: null })],
      [],
      [buildBaseEntity({ image_id: 'image-1' })],
      false,
    );

    expect(entry.imageId).toBeNull();
  });

  it('has no image for a linked entity without one', () => {
    const [entry] = buildCombatantEntries(
      [buildEncounterQueueItem({ id: 'a' })],
      [],
      [buildBaseEntity({ image_id: null })],
      false,
    );

    expect(entry.imageId).toBeNull();
  });

  it('follows starting_max_hp for the HP fields', () => {
    const entries = buildCombatantEntries(
      [
        buildEncounterQueueItem({ id: 'a', starting_max_hp: 7 }),
        buildEncounterQueueItem({ id: 'b', starting_max_hp: null }),
      ],
      [],
      [buildBaseEntity()],
      false,
    );

    expect(
      entries.map(({ maxHp, currentHp, tempHp }) => ({
        maxHp,
        currentHp,
        tempHp,
      })),
    ).toEqual([
      { maxHp: 7, currentHp: 7, tempHp: 0 },
      { maxHp: null, currentHp: null, tempHp: 0 },
    ]);
  });

  it('applies a damage entry to the HP fields', () => {
    const [entry] = buildCombatantEntries(
      [buildEncounterQueueItem({ id: 'a', starting_max_hp: 7 })],
      [
        buildEncounterLogEntry('damage', {
          targets: [{ queueItemId: 'a', amount: 3 }],
        }),
      ],
      [buildBaseEntity()],
      false,
    );

    expect(entry).toMatchObject({ maxHp: 7, currentHp: 4 });
  });

  it('leaves a removed item out and renumbers its sibling', () => {
    const goblins = [
      buildEncounterQueueItem({ id: 'a', name: 'Goblin', sequence_number: 1 }),
      buildEncounterQueueItem({ id: 'b', name: 'Goblin', sequence_number: 2 }),
    ];
    const removeFirst = buildEncounterLogEntry('removed', {
      queueItemIds: ['a'],
    });

    expect(
      buildCombatantEntries(goblins, [], [], false).map((entry) => entry.name),
    ).toEqual(['Goblin 1', 'Goblin 2']);
    expect(
      buildCombatantEntries(goblins, [removeFirst], [], false).map((entry) => ({
        id: entry.id,
        name: entry.name,
      })),
    ).toEqual([{ id: 'b', name: 'Goblin' }]);
  });

  it('keeps counting a hidden defeated item, so toggling Hide defeated never renumbers', () => {
    const goblins = [
      buildEncounterQueueItem({ id: 'a', name: 'Goblin', sequence_number: 1 }),
      buildEncounterQueueItem({ id: 'b', name: 'Goblin', sequence_number: 2 }),
    ];
    const defeatFirst = buildEncounterLogEntry('defeated', {
      queueItemIds: ['a'],
    });

    expect(
      buildCombatantEntries(goblins, [defeatFirst], [], true).map((entry) => ({
        id: entry.id,
        name: entry.name,
      })),
    ).toEqual([{ id: 'b', name: 'Goblin 2' }]);
  });

  it('drops a defeated item when hiding is on and keeps it in place, marked defeated, when it is off', () => {
    const items = [
      buildEncounterQueueItem({ id: 'a', name: 'First' }),
      buildEncounterQueueItem({ id: 'b', name: 'Second' }),
      buildEncounterQueueItem({ id: 'c', name: 'Third' }),
    ];
    const defeatSecond = buildEncounterLogEntry('defeated', {
      queueItemIds: ['b'],
    });

    expect(
      buildCombatantEntries(items, [defeatSecond], [], true).map(
        (entry) => entry.id,
      ),
    ).toEqual(['a', 'c']);
    expect(
      buildCombatantEntries(items, [defeatSecond], [], false).map((entry) => ({
        id: entry.id,
        defeated: entry.defeated,
      })),
    ).toEqual([
      { id: 'a', defeated: false },
      { id: 'b', defeated: true },
      { id: 'c', defeated: false },
    ]);
  });

  it('puts a combatant back in the queue with its derived HP when its removal is reverted', () => {
    const items = [
      buildEncounterQueueItem({ id: 'a', name: 'First', starting_max_hp: 10 }),
      buildEncounterQueueItem({ id: 'b', name: 'Second', starting_max_hp: 10 }),
    ];
    const damageSecond = buildEncounterLogEntry(
      'damage',
      { targets: [{ queueItemId: 'b', amount: 3 }] },
      { id: 'damage-second' },
    );
    const removeSecond = buildEncounterLogEntry(
      'removed',
      { queueItemIds: ['b'] },
      { id: 'remove-second' },
    );
    const revertRemoval = buildEncounterLogEntry(
      'revert',
      { entryId: removeSecond.id },
      { id: 'revert-removal' },
    );

    expect(
      buildCombatantEntries(
        items,
        [damageSecond, removeSecond, revertRemoval],
        [],
        false,
      ).map((entry) => ({ id: entry.id, currentHp: entry.currentHp })),
    ).toEqual([
      { id: 'a', currentHp: 10 },
      { id: 'b', currentHp: 7 },
    ]);
  });

  it('names a renamed combatant by its rename and keeps its numbered automatic name', () => {
    const [entry] = buildCombatantEntries(
      [
        buildEncounterQueueItem({
          id: 'a',
          name: 'Goblin',
          custom_name: 'Boss',
          sequence_number: 1,
        }),
        buildEncounterQueueItem({
          id: 'b',
          name: 'Goblin',
          sequence_number: 2,
        }),
      ],
      [],
      [buildBaseEntity()],
      false,
    );

    expect(entry).toMatchObject({ name: 'Boss', automaticName: 'Goblin 1' });
  });

  it('carries the id and type of an entity in the lists and none for a combatant whose entity is absent or whose base_entity_id is null', () => {
    const entries = buildCombatantEntries(
      [
        buildEncounterQueueItem({ id: 'a', sort_order: 0 }),
        buildEncounterQueueItem({
          id: 'b',
          base_entity_id: 'deleted',
          sort_order: 1,
        }),
        buildEncounterQueueItem({
          id: 'c',
          base_entity_id: null,
          sort_order: 2,
        }),
      ],
      [],
      [buildBaseEntity({ entity_type: 'npcs' })],
      false,
    );

    expect(entries.map((entry) => entry.entity)).toEqual([
      { id: BASE_ENTITY_ID, entityType: 'npcs' },
      null,
      null,
    ]);
  });

  describe('events', () => {
    const event = (id: string, name: string | null, sort_order: number) =>
      buildEncounterQueueItem({
        id,
        kind: 'event',
        base_entity_id: null,
        sequence_number: null,
        name,
        sort_order,
      });

    it('builds an event entry with its id and name in queue order beside combatants, and a random combatant as a combatant entry with no entity or image', () => {
      const entries = buildQueueEntries(
        [
          buildEncounterQueueItem({
            id: 'a',
            base_entity_id: null,
            name: 'Grunt',
            starting_max_hp: 10,
            sort_order: 0,
          }),
          event('b', 'Lair action', 1),
        ],
        [],
        [buildBaseEntity({ image_id: 'image-1' })],
        false,
      );

      expect(entries).toEqual([
        {
          kind: 'combatant',
          id: 'a',
          name: 'Grunt',
          automaticName: 'Grunt',
          entity: null,
          imageId: null,
          maxHp: 10,
          currentHp: 10,
          tempHp: 0,
          defeated: false,
        },
        { kind: 'event', id: 'b', name: 'Lair action' },
      ]);
    });

    it('keeps an event when hiding is on even if a defeated entry names it, and still drops a defeated combatant', () => {
      const entries = buildQueueEntries(
        [
          buildEncounterQueueItem({ id: 'a', name: 'Goblin', sort_order: 0 }),
          event('b', 'Lair action', 1),
        ],
        [buildEncounterLogEntry('defeated', { queueItemIds: ['a', 'b'] })],
        [],
        true,
      );

      expect(entries.map((entry) => entry.id)).toEqual(['b']);
    });

    it('drops a removed event and brings it back in its place when the removal is reverted', () => {
      const items = [
        buildEncounterQueueItem({ id: 'a', name: 'Goblin', sort_order: 0 }),
        event('b', 'Lair action', 1),
        buildEncounterQueueItem({ id: 'c', name: 'Orc', sort_order: 2 }),
      ];
      const removeEvent = buildEncounterLogEntry(
        'removed',
        { queueItemIds: ['b'] },
        { id: 'remove-event' },
      );
      const revert = buildEncounterLogEntry(
        'revert',
        { entryId: 'remove-event' },
        { id: 'revert-removal' },
      );

      expect(
        buildQueueEntries(items, [removeEvent], [], false).map(
          (entry) => entry.id,
        ),
      ).toEqual(['a', 'c']);
      expect(
        buildQueueEntries(items, [removeEvent, revert], [], false).map(
          (entry) => entry.id,
        ),
      ).toEqual(['a', 'b', 'c']);
    });
  });
});
