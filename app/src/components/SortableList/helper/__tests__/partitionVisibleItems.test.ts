import { describe, expect, it } from 'vitest';
import { partitionVisibleItems } from '../partitionVisibleItems';

describe('partitionVisibleItems', () => {
  const pinned = { id: '1', pinned_order: 0 };
  const unpinned = { id: '2', pinned_order: null };

  it('pins nothing while searching', () => {
    expect(partitionVisibleItems([pinned, unpinned], true)).toEqual({
      pinnedItems: [],
      unpinnedItems: [pinned, unpinned],
    });
  });

  it('splits pinned from unpinned items when not searching', () => {
    expect(partitionVisibleItems([pinned, unpinned], false)).toEqual({
      pinnedItems: [pinned],
      unpinnedItems: [unpinned],
    });
  });
});
