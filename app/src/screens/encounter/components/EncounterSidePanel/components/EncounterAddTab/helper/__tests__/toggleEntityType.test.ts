import { describe, it, expect } from 'vitest';
import { toggleEntityType } from '../toggleEntityType';

describe('toggleEntityType', () => {
  it('adds an absent type at the end and keeps the others', () => {
    expect(toggleEntityType(['foes', 'npcs'], 'pcs')).toEqual([
      'foes',
      'npcs',
      'pcs',
    ]);
  });

  it('removes a present type and keeps the others', () => {
    expect(toggleEntityType(['foes', 'npcs', 'pcs'], 'npcs')).toEqual([
      'foes',
      'pcs',
    ]);
  });
});
