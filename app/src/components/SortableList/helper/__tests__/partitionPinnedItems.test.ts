import { describe, it, expect } from 'vitest';
import { partitionPinnedItems } from '../partitionPinnedItems';

describe('partitionPinnedItems', () => {
  it('returns every item as unpinned when no item has a pinned_order', () => {
    const items = [
      { id: '1', pinned_order: null },
      { id: '2', pinned_order: null },
    ];

    const result = partitionPinnedItems(items);

    expect(result.pinnedItems).toEqual([]);
    expect(result.unpinnedItems).toEqual(items);
  });

  it('moves items with a numeric pinned_order into pinnedItems', () => {
    const pinned = { id: '1', pinned_order: 0 };
    const unpinned = { id: '2', pinned_order: null };

    const result = partitionPinnedItems([pinned, unpinned]);

    expect(result.pinnedItems).toEqual([pinned]);
    expect(result.unpinnedItems).toEqual([unpinned]);
  });

  it('orders pinnedItems ascending by pinned_order', () => {
    const first = { id: '1', pinned_order: 2 };
    const second = { id: '2', pinned_order: 0 };
    const third = { id: '3', pinned_order: 1 };

    const result = partitionPinnedItems([first, second, third]);

    expect(result.pinnedItems).toEqual([second, third, first]);
  });

  it('preserves the input order of unpinnedItems', () => {
    const first = { id: '1', pinned_order: null };
    const second = { id: '2', pinned_order: null };
    const third = { id: '3', pinned_order: null };

    const result = partitionPinnedItems([third, first, second]);

    expect(result.unpinnedItems).toEqual([third, first, second]);
  });
});
