import { partitionPinnedItems } from './partitionPinnedItems';

// A search shows its matches in match order, so it pins nothing.
export const partitionVisibleItems = <T extends Record<string, unknown>>(
  items: T[],
  isSearching: boolean,
): { pinnedItems: T[]; unpinnedItems: T[] } =>
  isSearching
    ? { pinnedItems: [], unpinnedItems: items }
    : partitionPinnedItems(items);
