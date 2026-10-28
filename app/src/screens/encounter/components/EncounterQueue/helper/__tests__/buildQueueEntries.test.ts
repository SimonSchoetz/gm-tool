import { describe, it, expect } from 'vitest';
import { buildBaseEntity } from '@/__tests__/support/buildBaseEntity';
import { buildEncounterQueueItem } from '@/__tests__/support/buildEncounterQueueItem';
import { buildQueueEntries } from '../buildQueueEntries';

describe('buildQueueEntries', () => {
  it('keeps the order of the queue items', () => {
    const entries = buildQueueEntries(
      [
        buildEncounterQueueItem({ id: 'b', sort_order: 1 }),
        buildEncounterQueueItem({ id: 'a', sort_order: 0 }),
      ],
      [buildBaseEntity()],
    );

    expect(entries.map((entry) => entry.id)).toEqual(['b', 'a']);
  });

  it("shows the entity's current name and image after a rename", () => {
    const [entry] = buildQueueEntries(
      [buildEncounterQueueItem({ id: 'a', name: 'Old Name' })],
      [buildBaseEntity({ name: 'Renamed', image_id: 'image-9' })],
    );

    expect(entry).toMatchObject({ name: 'Renamed', imageId: 'image-9' });
  });

  it('keeps the stored name and has no image for a combatant of a deleted entity', () => {
    const [entry] = buildQueueEntries(
      [buildEncounterQueueItem({ id: 'a', name: 'Stored' })],
      [],
    );

    expect(entry).toMatchObject({ name: 'Stored', imageId: null });
  });

  it('has no image for a combatant without a base entity', () => {
    const [entry] = buildQueueEntries(
      [buildEncounterQueueItem({ id: 'a', base_entity_id: null })],
      [buildBaseEntity({ image_id: 'image-1' })],
    );

    expect(entry.imageId).toBeNull();
  });

  it('has no image for a linked entity without one', () => {
    const [entry] = buildQueueEntries(
      [buildEncounterQueueItem({ id: 'a' })],
      [buildBaseEntity({ image_id: null })],
    );

    expect(entry.imageId).toBeNull();
  });

  it('follows starting_max_hp for the HP fields', () => {
    const entries = buildQueueEntries(
      [
        buildEncounterQueueItem({ id: 'a', starting_max_hp: 7 }),
        buildEncounterQueueItem({ id: 'b', starting_max_hp: null }),
      ],
      [buildBaseEntity()],
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
});
