import { describe, it, expect } from 'vitest';
import type { BaseEntity } from '@db/base-entity';
import type { EncounterQueueItem } from '@db/encounter-queue-item';
import { buildQueueEntries } from '../buildQueueEntries';

const queueItem = (
  id: string,
  overrides: Partial<EncounterQueueItem> = {},
): EncounterQueueItem => ({
  id,
  encounter_id: 'encounter-1',
  kind: 'combatant',
  base_entity_id: 'goblin',
  name: 'Goblin',
  custom_name: null,
  notes: null,
  sequence_number: 1,
  starting_max_hp: null,
  sort_order: 0,
  created_at: '',
  updated_at: '',
  ...overrides,
});

const baseEntity = (overrides: Partial<BaseEntity> = {}): BaseEntity => ({
  id: 'goblin',
  adventure_id: 'adventure-1',
  entity_type: 'foes',
  name: 'Goblin',
  description: null,
  image_id: 'image-1',
  pinned_order: null,
  created_at: '',
  updated_at: '',
  ...overrides,
});

describe('buildQueueEntries', () => {
  it('keeps the order of the queue items', () => {
    const entries = buildQueueEntries(
      [queueItem('b', { sort_order: 1 }), queueItem('a', { sort_order: 0 })],
      [baseEntity()],
    );

    expect(entries.map((entry) => entry.id)).toEqual(['b', 'a']);
  });

  it("shows the entity's current name and image after a rename", () => {
    const [entry] = buildQueueEntries(
      [queueItem('a', { name: 'Old Name' })],
      [baseEntity({ name: 'Renamed', image_id: 'image-9' })],
    );

    expect(entry).toMatchObject({ name: 'Renamed', imageId: 'image-9' });
  });

  it('keeps the stored name and has no image for a combatant of a deleted entity', () => {
    const [entry] = buildQueueEntries([queueItem('a', { name: 'Stored' })], []);

    expect(entry).toMatchObject({ name: 'Stored', imageId: null });
  });

  it('has no image for a combatant without a base entity', () => {
    const [entry] = buildQueueEntries(
      [queueItem('a', { base_entity_id: null })],
      [baseEntity()],
    );

    expect(entry.imageId).toBeNull();
  });

  it('has no image for a linked entity without one', () => {
    const [entry] = buildQueueEntries(
      [queueItem('a')],
      [baseEntity({ image_id: null })],
    );

    expect(entry.imageId).toBeNull();
  });

  it('follows starting_max_hp for the HP fields', () => {
    const entries = buildQueueEntries(
      [
        queueItem('a', { starting_max_hp: 7 }),
        queueItem('b', { starting_max_hp: null }),
      ],
      [baseEntity()],
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
