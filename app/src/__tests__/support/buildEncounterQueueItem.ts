import type { EncounterQueueItem } from '@db/encounter-queue-item';

export const buildEncounterQueueItem = (
  overrides: Partial<EncounterQueueItem> = {},
): EncounterQueueItem => ({
  id: 'item-1',
  encounter_id: 'encounter-1',
  kind: 'combatant',
  base_entity_id: 'entity-1',
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
