import type { BlockRow } from './collectBlockRows';

// A box in the coordinates of the anchor element, the editor container that the handle, the drop line and the highlight are absolutely positioned in.
export type AnchorBox = { top: number; left: number; height: number };

// A row's box in anchor space: its top, the left edge of its marker column, and its height. The one place a row's client rectangle becomes the position of something drawn beside it.
export const rowBoxInAnchorSpace = (
  anchorRect: Pick<DOMRect, 'left' | 'top'>,
  row: Pick<BlockRow, 'markerLeft' | 'top' | 'bottom'>,
): AnchorBox => ({
  top: row.top - anchorRect.top,
  left: row.markerLeft - anchorRect.left,
  height: row.bottom - row.top,
});
