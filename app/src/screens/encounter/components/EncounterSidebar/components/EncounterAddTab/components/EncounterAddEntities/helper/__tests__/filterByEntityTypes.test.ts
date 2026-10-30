import { describe, it, expect } from 'vitest';
import { buildBaseEntity } from '@/__tests__/support/buildBaseEntity';
import { BASE_ENTITY_TYPES } from '@domain';
import { filterByEntityTypes } from '../filterByEntityTypes';

const entities = BASE_ENTITY_TYPES.map((entityType) =>
  buildBaseEntity({
    id: entityType,
    entity_type: entityType,
    name: entityType,
  }),
);

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
