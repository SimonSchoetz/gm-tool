import type { EncounterQueueItem } from '@db/encounter-queue-item';
import { BASE_ENTITY_ID } from './buildBaseEntity';

export const QUEUE_ITEM_ENCOUNTER_ID = 'encounter-1';

export const buildEncounterQueueItem = (
  overrides: Partial<EncounterQueueItem> = {},
): EncounterQueueItem => ({
  id: 'item-1',
  encounter_id: QUEUE_ITEM_ENCOUNTER_ID,
  kind: 'combatant',
  base_entity_id: BASE_ENTITY_ID,
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
