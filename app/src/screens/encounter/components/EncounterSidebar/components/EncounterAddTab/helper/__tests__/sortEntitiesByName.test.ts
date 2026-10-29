import { describe, it, expect } from 'vitest';
import { buildBaseEntity } from '@/__tests__/support/buildBaseEntity';
import { sortEntitiesByName } from '../sortEntitiesByName';

describe('sortEntitiesByName', () => {
  it('orders named entities A to Z and puts unnamed ones last in input order', () => {
    const sorted = sortEntitiesByName([
      buildBaseEntity({ id: 'unnamed-1', name: null }),
      buildBaseEntity({ id: 'orc', name: 'Orc' }),
      buildBaseEntity({ id: 'unnamed-2', name: null }),
      buildBaseEntity({ id: 'goblin', name: 'Goblin' }),
    ]);

    expect(sorted.map((e) => e.id)).toEqual([
      'goblin',
      'orc',
      'unnamed-1',
      'unnamed-2',
    ]);
  });

  it('leaves the array it was given unchanged', () => {
    const entities = [
      buildBaseEntity({ id: 'orc', name: 'Orc' }),
      buildBaseEntity({ id: 'goblin', name: 'Goblin' }),
    ];

    sortEntitiesByName(entities);

    expect(entities.map((e) => e.id)).toEqual(['orc', 'goblin']);
  });
});
