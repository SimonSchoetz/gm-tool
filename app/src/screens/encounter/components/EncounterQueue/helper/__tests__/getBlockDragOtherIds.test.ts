import { describe, expect, it } from 'vitest';
import { getBlockDragOtherIds } from '../getBlockDragOtherIds';

describe('getBlockDragOtherIds', () => {
  it('returns the other selected ids in selection order when the dragged id is selected', () => {
    expect(getBlockDragOtherIds(['a', 'b', 'c'], 'b')).toEqual(['a', 'c']);
  });

  it('returns nothing when the dragged id is not selected', () => {
    expect(getBlockDragOtherIds(['a', 'c'], 'b')).toEqual([]);
  });

  it('returns nothing when the dragged id is the only selected one', () => {
    expect(getBlockDragOtherIds(['b'], 'b')).toEqual([]);
  });
});
