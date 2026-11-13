import type { BlockRow } from './collectBlockRows';

// A box in the coordinates of the anchor element, the editor container that the handle, the drop line and the highlight are absolutely positioned in.
export type AnchorBox = {
  top: number;
  left: number;
  height: number;
  // The height of the whole unit the row moves: a list item with its sub-items, a toggle with its body; the row's own `height` for every other row.
  unitHeight: number;
};

// A row's box in anchor space: its top, the left edge of its marker column, its own height and the height of its whole unit. The one place a row's client rectangle becomes the position of something drawn beside it.
export const rowBoxInAnchorSpace = (
  anchorRect: Pick<DOMRect, 'left' | 'top'>,
  row: Pick<BlockRow, 'markerLeft' | 'top' | 'bottom' | 'unitBottom'>,
): AnchorBox => ({
  top: row.top - anchorRect.top,
  left: row.markerLeft - anchorRect.left,
  height: row.bottom - row.top,
  unitHeight: row.unitBottom - row.top,
});
