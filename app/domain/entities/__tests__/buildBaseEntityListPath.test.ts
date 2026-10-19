import { describe, it, expect } from 'vitest';
import { buildBaseEntityListPath } from '../buildBaseEntityListPath';

describe('buildBaseEntityListPath', () => {
  it('returns the adventure-scoped list path of the entity type', () => {
    expect(buildBaseEntityListPath('npcs', 'adv-1')).toBe(
      '/adventure/adv-1/npcs',
    );
  });
});
