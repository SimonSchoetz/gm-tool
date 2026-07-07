import type { HintDirection } from '../../../TableEdgeHandlePlugin';
import { TABLE_HINT_WIDTH } from '../../../tableEdgeHandlePlugin.constants';

export const calculateHintPosition = (
  direction: HintDirection,
  cellRect: DOMRect,
): { left: number; top: number } => {
  switch (direction) {
    case 'top':
      return {
        left: cellRect.left + cellRect.width / 2 - TABLE_HINT_WIDTH / 2,
        top: cellRect.top - 1,
      };
    case 'bottom':
      return {
        left: cellRect.left + cellRect.width / 2 - TABLE_HINT_WIDTH / 2,
        top: cellRect.bottom - 1,
      };
    case 'left':
      return {
        left: cellRect.left - 1,
        top: cellRect.top + cellRect.height / 2 - TABLE_HINT_WIDTH / 2,
      };
    case 'right':
      return {
        left: cellRect.right - 1,
        top: cellRect.top + cellRect.height / 2 - TABLE_HINT_WIDTH / 2,
      };
  }
};
