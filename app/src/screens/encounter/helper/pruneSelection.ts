import type { SelectionState } from './applySelectionClick';

export const pruneSelection = (
  state: SelectionState,
  shownIds: string[],
): SelectionState => {
  const keptIds = state.ids.filter((id) => shownIds.includes(id));
  const anchorShown =
    state.anchorId === null || shownIds.includes(state.anchorId);
  const shownItemKept =
    state.shownItemId === null || keptIds.includes(state.shownItemId);
  if (keptIds.length === state.ids.length && anchorShown && shownItemKept) {
    return state;
  }

  return {
    ids: keptIds,
    anchorId: anchorShown ? state.anchorId : null,
    shownItemId: shownItemKept ? state.shownItemId : null,
  };
};
