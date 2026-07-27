import { RangeSelection } from 'lexical';
import { $isToggleNode, ToggleNode } from '../../../nodes';
import { resolveTopLevelBlock } from '../../../helper';

export const resolveHeaderToggleForRemoval = (
  selection: RangeSelection,
): ToggleNode | null => {
  if (selection.isCollapsed()) return null;

  const startPoint = selection.isBackward()
    ? selection.focus
    : selection.anchor;
  const startNode = startPoint.getNode();

  let headerToggle: ToggleNode | null = null;
  for (const node of selection.getNodes()) {
    const block = resolveTopLevelBlock(node);
    const parent = block.getParent();
    if ($isToggleNode(parent)) {
      headerToggle = parent;
      break;
    }
  }

  if (!headerToggle || headerToggle.isParentOf(startNode)) return null;

  return headerToggle;
};
