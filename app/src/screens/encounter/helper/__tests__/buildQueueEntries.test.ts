import { describe, it, expect } from 'vitest';
import { buildBaseEntity } from '@/__tests__/support/buildBaseEntity';
import { buildEncounterLogEntry } from '@/__tests__/support/buildEncounterLogEntry';
import { buildEncounterQueueItem } from '@/__tests__/support/buildEncounterQueueItem';
import { buildQueueEntries } from '../buildQueueEntries';

describe('buildQueueEntries', () => {
  it('keeps the order of the queue items', () => {
    const entries = buildQueueEntries(
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
    const [entry] = buildQueueEntries(
      [buildEncounterQueueItem({ id: 'a', name: 'Old Name' })],
      [],
      [buildBaseEntity({ name: 'Renamed', image_id: 'image-9' })],
      false,
    );

    expect(entry).toMatchObject({ name: 'Renamed', imageId: 'image-9' });
  });

  it('keeps the stored name and has no image for a combatant of a deleted entity', () => {
    const [entry] = buildQueueEntries(
      [buildEncounterQueueItem({ id: 'a', name: 'Stored' })],
      [],
      [],
      false,
    );

    expect(entry).toMatchObject({ name: 'Stored', imageId: null });
  });

  it('has no image for a combatant without a base entity', () => {
    const [entry] = buildQueueEntries(
      [buildEncounterQueueItem({ id: 'a', base_entity_id: null })],
      [],
      [buildBaseEntity({ image_id: 'image-1' })],
      false,
    );

    expect(entry.imageId).toBeNull();
  });

  it('has no image for a linked entity without one', () => {
    const [entry] = buildQueueEntries(
      [buildEncounterQueueItem({ id: 'a' })],
      [],
      [buildBaseEntity({ image_id: null })],
      false,
    );

    expect(entry.imageId).toBeNull();
  });

  it('follows starting_max_hp for the HP fields', () => {
    const entries = buildQueueEntries(
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
    const [entry] = buildQueueEntries(
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
      buildQueueEntries(goblins, [], [], false).map((entry) => entry.name),
    ).toEqual(['Goblin 1', 'Goblin 2']);
    expect(
      buildQueueEntries(goblins, [removeFirst], [], false).map((entry) => ({
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
      buildQueueEntries(goblins, [defeatFirst], [], true).map((entry) => ({
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
      buildQueueEntries(items, [defeatSecond], [], true).map(
        (entry) => entry.id,
      ),
    ).toEqual(['a', 'c']);
    expect(
      buildQueueEntries(items, [defeatSecond], [], false).map((entry) => ({
        id: entry.id,
        defeated: entry.defeated,
      })),
    ).toEqual([
      { id: 'a', defeated: false },
      { id: 'b', defeated: true },
      { id: 'c', defeated: false },
    ]);
  });
});
