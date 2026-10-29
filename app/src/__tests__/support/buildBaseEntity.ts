import type { BaseEntity } from '@db/base-entity';

export const BASE_ENTITY_ID = 'entity-1';

export const buildBaseEntity = (
  overrides: Partial<BaseEntity> = {},
): BaseEntity => ({
  id: BASE_ENTITY_ID,
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
