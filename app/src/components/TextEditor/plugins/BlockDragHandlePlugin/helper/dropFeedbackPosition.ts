import { rowBoxInAnchorSpace } from './rowBoxInAnchorSpace';
import type { DropTarget } from './resolveDropTarget';

// Where the drop line and the highlight are drawn, in anchor space.
export type DropFeedbackPosition = {
  lineTop: number;
  lineLeft: number;
  highlightTop: number;
  highlightLeft: number;
  highlightHeight: number;
};

// The drop line starts where the target says in client coordinates, and the highlight is the box of the row under the pointer, taken as the hovered row's box is.
export const dropFeedbackPosition = (
  anchorRect: Pick<DOMRect, 'left' | 'top'>,
  target: Pick<DropTarget, 'lineLeft' | 'lineTop' | 'row'>,
): DropFeedbackPosition => {
  const highlight = rowBoxInAnchorSpace(anchorRect, target.row);
  return {
    lineTop: target.lineTop - anchorRect.top,
    lineLeft: target.lineLeft - anchorRect.left,
    highlightTop: highlight.top,
    highlightLeft: highlight.left,
    highlightHeight: highlight.height,
  };
};
