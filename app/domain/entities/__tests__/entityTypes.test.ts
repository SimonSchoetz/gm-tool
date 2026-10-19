import { describe, it, expect } from 'vitest';
import {
  BASE_ENTITY_TYPES,
  ENTITY_TYPES,
  isBaseEntityType,
  isEntityType,
} from '../entityTypes';

describe('isBaseEntityType', () => {
  it.each(BASE_ENTITY_TYPES)('returns true for %s', (value) => {
    expect(isBaseEntityType(value)).toBe(true);
  });

  it.each(['sessions', 'encounters', 'adventures', 'stories'])(
    'returns false for %s',
    (value) => {
      expect(isBaseEntityType(value)).toBe(false);
    },
  );
});

describe('isEntityType', () => {
  it.each(ENTITY_TYPES)(
    'returns true for %s, a base or non-base entity type',
    (value) => {
      expect(isEntityType(value)).toBe(true);
    },
  );

  it.each(['stories', 'npc', ''])('returns false for %j', (value) => {
    expect(isEntityType(value)).toBe(false);
  });
});

describe('ENTITY_TYPES', () => {
  it('lists the base entity types first', () => {
    expect(ENTITY_TYPES.slice(0, BASE_ENTITY_TYPES.length)).toEqual(
      BASE_ENTITY_TYPES,
    );
  });
});
