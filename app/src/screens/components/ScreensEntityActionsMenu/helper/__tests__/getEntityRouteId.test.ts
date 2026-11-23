import { describe, expect, it } from 'vitest';
import type { EntityType } from '@domain';
import { getEntityRouteId } from '../getEntityRouteId';

const PARAMS = {
  adventureId: 'adventure-1',
  sessionId: 'session-1',
  encounterId: 'encounter-1',
  baseEntityId: 'base-entity-1',
};

describe('getEntityRouteId', () => {
  it.each<[EntityType, string]>([
    ['adventures', 'adventure-1'],
    ['sessions', 'session-1'],
    ['encounters', 'encounter-1'],
    ['npcs', 'base-entity-1'],
    ['pcs', 'base-entity-1'],
    ['foes', 'base-entity-1'],
    ['factions', 'base-entity-1'],
    ['locations', 'base-entity-1'],
    ['items', 'base-entity-1'],
  ])('reads the id of a %s route from its own param', (entityType, id) => {
    expect(getEntityRouteId(entityType, PARAMS)).toBe(id);
  });

  it.each<EntityType>([
    'adventures',
    'sessions',
    'encounters',
    'npcs',
    'pcs',
    'foes',
    'factions',
    'locations',
    'items',
  ])(
    'returns the empty string when a %s route has no such param',
    (entityType) => {
      expect(getEntityRouteId(entityType, {})).toBe('');
    },
  );
});
