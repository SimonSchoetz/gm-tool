import { describe, it, expect } from 'vitest';
import type { BaseEntity } from '@db/base-entity';
import { BASE_ENTITY_TYPES } from '@domain';
import { filterByEntityTypes } from '../filterByEntityTypes';

const entities: BaseEntity[] = BASE_ENTITY_TYPES.map((entityType) => ({
  id: entityType,
  adventure_id: 'adventure-1',
  entity_type: entityType,
  name: entityType,
  description: null,
  image_id: null,
  pinned_order: null,
  created_at: '',
  updated_at: '',
}));

describe('filterByEntityTypes', () => {
  it('keeps every type for an empty selection', () => {
    expect(filterByEntityTypes(entities, [])).toEqual(entities);
  });

  it('keeps only the selected types', () => {
    expect(
      filterByEntityTypes(entities, ['foes', 'npcs']).map((e) => e.entity_type),
    ).toEqual(
      BASE_ENTITY_TYPES.filter((type) => type === 'foes' || type === 'npcs'),
    );
  });
});
