export const isItemPinned = (item: Record<string, unknown>): boolean =>
  typeof item.pinned_order === 'number';
