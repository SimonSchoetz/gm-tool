export type SelectionModifiers = { shift: boolean; toggle: boolean };
export type SelectionState = {
  ids: string[];
  anchorId: string | null;
  shownItemId: string | null;
};

export const applySelectionClick = (
  state: SelectionState,
  shownIds: string[],
  clickedId: string,
  modifiers: SelectionModifiers,
): SelectionState => {
  const anchorIndex = shownIds.findIndex((id) => id === state.anchorId);

  if (modifiers.shift && anchorIndex !== -1) {
    const clickedIndex = shownIds.indexOf(clickedId);
    const from = Math.min(anchorIndex, clickedIndex);
    const to = Math.max(anchorIndex, clickedIndex);
    return {
      ids: shownIds.slice(from, to + 1),
      anchorId: state.anchorId,
      shownItemId: clickedId,
    };
  }

  if (modifiers.toggle && !modifiers.shift) {
    if (state.ids.includes(clickedId)) {
      return {
        ids: state.ids.filter((id) => id !== clickedId),
        anchorId: clickedId,
        shownItemId: state.shownItemId === clickedId ? null : state.shownItemId,
      };
    }
    return {
      ids: [...state.ids, clickedId],
      anchorId: clickedId,
      shownItemId: clickedId,
    };
  }

  return { ids: [clickedId], anchorId: clickedId, shownItemId: clickedId };
};
