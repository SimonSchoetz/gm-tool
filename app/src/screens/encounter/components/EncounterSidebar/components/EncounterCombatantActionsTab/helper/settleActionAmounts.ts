export type ActionAmountsState = {
  sharedText: string;
  rowTexts: Record<string, string>;
};

export const settleActionAmounts = (
  state: ActionAmountsState,
  selectedIds: string[],
): ActionAmountsState => {
  const rowEntries = Object.entries(state.rowTexts);

  if (selectedIds.length === 1) {
    if (rowEntries.length === 0) return state;
    const [onlyId] = selectedIds;
    return {
      sharedText: Object.hasOwn(state.rowTexts, onlyId)
        ? state.rowTexts[onlyId]
        : state.sharedText,
      rowTexts: {},
    };
  }

  const keptEntries = rowEntries.filter(([id]) => selectedIds.includes(id));
  if (keptEntries.length === rowEntries.length) return state;
  return {
    sharedText: state.sharedText,
    rowTexts: Object.fromEntries(keptEntries),
  };
};
