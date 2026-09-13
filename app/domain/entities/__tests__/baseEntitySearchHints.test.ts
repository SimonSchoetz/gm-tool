import { describe, it, expect } from 'vitest';
import { baseEntitySearchHint } from '../baseEntitySearchHints';

describe('baseEntitySearchHint', () => {
  it.each([
    ['npcs', 'profession'],
    ['foes', 'type'],
    ['pcs', 'faction'],
    ['factions', 'leader'],
    ['locations', 'region'],
    ['items', 'type'],
  ] as const)('returns %s for %s', (entityType, hint) => {
    expect(baseEntitySearchHint(entityType)).toBe(hint);
  });
});
