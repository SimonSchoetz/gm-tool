import { describe, expect, it } from 'vitest';
import { getDraggedIds } from '../getDraggedIds';

describe('getDraggedIds', () => {
  it('returns only the dragged id when no block drag is running', () => {
    expect(getDraggedIds('b', null)).toEqual(['b']);
  });

  it('returns the dragged id first, then the other ids of the block', () => {
    expect(getDraggedIds('b', { otherIds: ['a', 'c'] })).toEqual([
      'b',
      'a',
      'c',
    ]);
  });
});
