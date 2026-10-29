import { describe, expect, it } from 'vitest';
import { pruneSelection } from '../pruneSelection';

describe('pruneSelection', () => {
  it('returns the same object when every id and the anchor are shown', () => {
    const state = { ids: ['a', 'b'], anchorId: 'a' };

    expect(pruneSelection(state, ['a', 'b', 'c'])).toBe(state);
  });

  it('returns the same object for an empty selection without an anchor', () => {
    const state = { ids: [], anchorId: null };

    expect(pruneSelection(state, ['a'])).toBe(state);
  });

  it('drops an unshown id and keeps the shown ones', () => {
    const result = pruneSelection({ ids: ['a', 'b', 'c'], anchorId: 'a' }, [
      'a',
      'c',
    ]);

    expect(result).toEqual({ ids: ['a', 'c'], anchorId: 'a' });
  });

  it('sets an unshown anchor to null and keeps a shown anchor', () => {
    expect(pruneSelection({ ids: ['a'], anchorId: 'b' }, ['a'])).toEqual({
      ids: ['a'],
      anchorId: null,
    });
    expect(pruneSelection({ ids: ['b'], anchorId: 'a' }, ['a'])).toEqual({
      ids: [],
      anchorId: 'a',
    });
  });
});
