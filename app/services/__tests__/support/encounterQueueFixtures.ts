import type { BaseEntity } from '@db/base-entity';
import type { BaseEntityContentSection } from '@db/base-entity-content-section';
import type { EncounterQueueItem } from '@db/encounter-queue-item';

export const buildEncounterQueueItem = (
  overrides: Partial<EncounterQueueItem> = {},
): EncounterQueueItem => ({
  id: 'item-1',
  encounter_id: 'encounter-1',
  kind: 'combatant',
  base_entity_id: 'entity-1',
  name: null,
  custom_name: null,
  notes: null,
  sequence_number: 1,
  starting_max_hp: null,
  sort_order: 0,
  created_at: '',
  updated_at: '',
  ...overrides,
});

export const buildBaseEntity = (
  overrides: Partial<BaseEntity> = {},
): BaseEntity => ({
  id: 'entity-1',
  adventure_id: 'adventure-1',
  entity_type: 'foes',
  name: 'Goblin',
  description: null,
  image_id: null,
  pinned_order: null,
  created_at: '',
  updated_at: '',
  ...overrides,
});

export const buildSection = (
  type: BaseEntityContentSection['type'],
  content: string | null,
): BaseEntityContentSection => ({
  id: `section-${type}`,
  base_entity_id: 'entity-1',
  name: null,
  type,
  content,
  checked: 0,
  sort_order: 0,
  created_at: '',
  updated_at: '',
});
