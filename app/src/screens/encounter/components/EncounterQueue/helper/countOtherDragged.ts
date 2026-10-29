export const countOtherDragged = (
  entryId: string,
  blockDrag: { activeId: string; otherIds: string[] } | null,
): number => (blockDrag?.activeId === entryId ? blockDrag.otherIds.length : 0);
