import { describe, expect, it } from 'vitest';
import { pruneSelection } from '../pruneSelection';

describe('pruneSelection', () => {
  it('returns the same object when every id, the anchor and the shown id are shown', () => {
    const state = { ids: ['a', 'b'], anchorId: 'a', shownItemId: 'b' };

    expect(pruneSelection(state, ['a', 'b', 'c'])).toBe(state);
  });

  it('returns the same object for an empty selection without an anchor', () => {
    const state = { ids: [], anchorId: null, shownItemId: null };

    expect(pruneSelection(state, ['a'])).toBe(state);
  });

  it('drops an unshown id and keeps the shown ones', () => {
    const result = pruneSelection(
      { ids: ['a', 'b', 'c'], anchorId: 'a', shownItemId: 'a' },
      ['a', 'c'],
    );

    expect(result).toEqual({
      ids: ['a', 'c'],
      anchorId: 'a',
      shownItemId: 'a',
    });
  });

  it('sets an unshown anchor to null and keeps a shown anchor', () => {
    expect(
      pruneSelection({ ids: ['a'], anchorId: 'b', shownItemId: 'a' }, ['a']),
    ).toEqual({ ids: ['a'], anchorId: null, shownItemId: 'a' });
    expect(
      pruneSelection({ ids: ['b'], anchorId: 'a', shownItemId: null }, ['a']),
    ).toEqual({ ids: [], anchorId: 'a', shownItemId: null });
  });

  it('sets a shown id that leaves the kept ids to null and keeps one that stays', () => {
    expect(
      pruneSelection({ ids: ['a', 'b'], anchorId: 'a', shownItemId: 'b' }, [
        'a',
      ]),
    ).toEqual({ ids: ['a'], anchorId: 'a', shownItemId: null });
    expect(
      pruneSelection({ ids: ['a', 'b'], anchorId: 'a', shownItemId: 'a' }, [
        'a',
      ]),
    ).toEqual({ ids: ['a'], anchorId: 'a', shownItemId: 'a' });
  });
});
