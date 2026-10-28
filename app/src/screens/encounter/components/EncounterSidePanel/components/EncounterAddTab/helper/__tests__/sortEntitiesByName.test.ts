import { describe, it, expect } from 'vitest';
import type { BaseEntity } from '@db/base-entity';
import { sortEntitiesByName } from '../sortEntitiesByName';

const entity = (id: string, name: string | null): BaseEntity => ({
  id,
  adventure_id: 'adventure-1',
  entity_type: 'foes',
  name,
  description: null,
  image_id: null,
  pinned_order: null,
  created_at: '',
  updated_at: '',
});

describe('sortEntitiesByName', () => {
  it('orders named entities A to Z and puts unnamed ones last in input order', () => {
    const sorted = sortEntitiesByName([
      entity('unnamed-1', null),
      entity('orc', 'Orc'),
      entity('unnamed-2', null),
      entity('goblin', 'Goblin'),
    ]);

    expect(sorted.map((e) => e.id)).toEqual([
      'goblin',
      'orc',
      'unnamed-1',
      'unnamed-2',
    ]);
  });

  it('leaves the array it was given unchanged', () => {
    const entities = [entity('orc', 'Orc'), entity('goblin', 'Goblin')];

    sortEntitiesByName(entities);

    expect(entities.map((e) => e.id)).toEqual(['orc', 'goblin']);
  });
});
