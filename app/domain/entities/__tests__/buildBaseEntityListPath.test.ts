import { describe, it, expect } from 'vitest';
import { buildBaseEntityListPath } from '../buildBaseEntityListPath';

describe('buildBaseEntityListPath', () => {
  it('returns the npcs list path', () => {
    expect(buildBaseEntityListPath('npcs', 'adv-1')).toBe(
      '/adventure/adv-1/npcs',
    );
  });

  it('returns the items list path', () => {
    expect(buildBaseEntityListPath('items', 'adv-1')).toBe(
      '/adventure/adv-1/items',
    );
  });
});
