import type { SelectionState } from './applySelectionClick';

export const pruneSelection = (
  state: SelectionState,
  shownIds: string[],
): SelectionState => {
  const keptIds = state.ids.filter((id) => shownIds.includes(id));
  const anchorShown =
    state.anchorId === null || shownIds.includes(state.anchorId);
  if (keptIds.length === state.ids.length && anchorShown) return state;

  return { ids: keptIds, anchorId: anchorShown ? state.anchorId : null };
};
