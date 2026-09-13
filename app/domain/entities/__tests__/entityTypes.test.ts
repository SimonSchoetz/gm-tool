import { describe, it, expect } from 'vitest';
import { ENTITY_TYPES, isBaseEntityType } from '../entityTypes';

describe('isBaseEntityType', () => {
  it.each(['npcs', 'foes', 'pcs', 'factions', 'locations', 'items'])(
    'returns true for %s',
    (value) => {
      expect(isBaseEntityType(value)).toBe(true);
    },
  );

  it.each(['sessions', 'encounters', 'adventures', 'stories'])(
    'returns false for %s',
    (value) => {
      expect(isBaseEntityType(value)).toBe(false);
    },
  );
});

describe('ENTITY_TYPES', () => {
  it('lists base entity types before sessions, encounters, and adventures', () => {
    expect(ENTITY_TYPES).toEqual([
      'npcs',
      'foes',
      'pcs',
      'factions',
      'locations',
      'items',
      'sessions',
      'encounters',
      'adventures',
    ]);
  });
});
