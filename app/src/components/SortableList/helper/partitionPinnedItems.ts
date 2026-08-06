import { isItemPinned } from './isItemPinned';

export const partitionPinnedItems = <T extends Record<string, unknown>>(
  items: T[],
): { pinnedItems: T[]; unpinnedItems: T[] } => {
  const pinnedItems: T[] = [];
  const unpinnedItems: T[] = [];

  for (const item of items) {
    if (isItemPinned(item)) {
      pinnedItems.push(item);
    } else {
      unpinnedItems.push(item);
    }
  }

  pinnedItems.sort((a, b) => {
    const aOrder = typeof a.pinned_order === 'number' ? a.pinned_order : 0;
    const bOrder = typeof b.pinned_order === 'number' ? b.pinned_order : 0;
    return aOrder - bOrder;
  });

  return { pinnedItems, unpinnedItems };
};
