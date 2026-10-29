export const getBlockDragOtherIds = (
  selectedIds: string[],
  activeId: string,
): string[] =>
  selectedIds.includes(activeId)
    ? selectedIds.filter((id) => id !== activeId)
    : [];
