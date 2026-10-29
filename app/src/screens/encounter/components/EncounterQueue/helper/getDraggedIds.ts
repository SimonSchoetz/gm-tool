export const getDraggedIds = (
  activeId: string,
  blockDrag: { otherIds: string[] } | null,
): string[] =>
  blockDrag === null ? [activeId] : [activeId, ...blockDrag.otherIds];
