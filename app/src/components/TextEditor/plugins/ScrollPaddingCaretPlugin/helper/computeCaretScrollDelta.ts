type VerticalEdges = Pick<DOMRect, 'top' | 'bottom'>;

export const computeCaretScrollDelta = (
  caret: VerticalEdges,
  scroller: VerticalEdges,
  paddingTop: number,
  paddingBottom: number,
): number => {
  // A rect of no height is a caret the browser could not measure, even through its holder element, not a caret at the top of the viewport.
  if (caret.top === caret.bottom) return 0;

  const rangeTop = scroller.top + paddingTop;
  const rangeBottom = scroller.bottom - paddingBottom;

  if (caret.top < rangeTop) return caret.top - rangeTop;
  if (caret.bottom > rangeBottom) {
    // Where the range is shorter than the caret, the top edge wins.
    return Math.min(caret.bottom - rangeBottom, caret.top - rangeTop);
  }
  return 0;
};
