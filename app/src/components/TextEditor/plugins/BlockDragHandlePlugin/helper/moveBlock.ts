import {
  $addUpdateTag,
  $createParagraphNode,
  $getNodeByKey,
  $isParagraphNode,
  HISTORY_PUSH_TAG,
  type LexicalNode,
  type NodeKey,
} from 'lexical';
import { $isListItemNode, $isListNode } from '@lexical/list';
import { $isToggleBodyNode } from '../../../nodes/ToggleBodyNode';
import type { DropPlacement } from './collectBlockRows';
import { convertListUnitToParagraph } from './convertListUnitToParagraph';
import { moveListUnit } from './moveListUnit';
import { wrapperAfter } from './wrapperAfter';

// The container a block stands in, the root or a toggle's body: for a list item, the one its root list stands in.
const containerOf = (node: LexicalNode): LexicalNode | null => {
  const parent = node.getParent();
  return $isListNode(parent) || $isListItemNode(parent)
    ? containerOf(parent)
    : parent;
};

// Whether the target lies inside the dragged block: among its children, or, for a list item, among its sub-items.
const isInsideDragged = (dragged: LexicalNode, target: LexicalNode): boolean =>
  dragged.isParentOf(target) ||
  ($isListItemNode(dragged) &&
    wrapperAfter(dragged)?.isParentOf(target) === true);

// Places the dragged block beside the target by what it is and where it lands. A landing in a list is for a paragraph or a list item beside a list item only; any other block, or target, with a depth is no position and nothing moves.
const relocate = (
  dragged: LexicalNode,
  target: LexicalNode,
  placement: DropPlacement,
  depth: number | null,
): void => {
  if (depth !== null) {
    if (
      ($isListItemNode(dragged) || $isParagraphNode(dragged)) &&
      $isListItemNode(target)
    ) {
      moveListUnit(dragged, target, placement, depth);
    }
    return;
  }
  if ($isListItemNode(dragged)) {
    convertListUnitToParagraph(dragged, target, placement);
    return;
  }

  const neighbour =
    placement === 'before'
      ? target.getPreviousSibling()
      : target.getNextSibling();
  if (neighbour?.is(dragged)) return;
  if (placement === 'before') {
    target.insertBefore(dragged);
  } else {
    target.insertAfter(dragged);
  }
};

// Moves the dragged block, with everything inside it, beside the target node, which may be in another container: the root or an open toggle's body. `depth` is the list depth the block lands at, or null where it lands outside every list: a paragraph or a list item landing in a list becomes an item of that list, and a list item landing outside every list becomes a paragraph. Runs inside an editor update. A position that leaves the arrangement as it is writes nothing: no node turns dirty, so no history entry and no save follow. A position inside the dragged block itself is no position. A move that happens tags the update so it is its own history entry: undo reverts the drop alone, never the typing before it. A toggle body the move leaves without a block gets one empty paragraph, since a body is never empty.
export const moveBlock = (
  draggedKey: NodeKey,
  targetKey: NodeKey,
  placement: DropPlacement,
  depth: number | null,
): void => {
  const dragged = $getNodeByKey(draggedKey);
  const target = $getNodeByKey(targetKey);
  if (
    dragged === null ||
    target === null ||
    dragged.is(target) ||
    isInsideDragged(dragged, target)
  ) {
    return;
  }

  const sourceContainer = containerOf(dragged);
  // An update that changes no node commits nothing, so the tag does no harm where the move turns out to leave things as they are.
  $addUpdateTag(HISTORY_PUSH_TAG);
  relocate(dragged, target, placement, depth);
  if ($isToggleBodyNode(sourceContainer) && sourceContainer.isEmpty()) {
    sourceContainer.append($createParagraphNode());
  }
};
