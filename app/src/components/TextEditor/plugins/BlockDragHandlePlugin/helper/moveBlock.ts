import {
  $addUpdateTag,
  $createParagraphNode,
  $getNodeByKey,
  HISTORY_PUSH_TAG,
  type NodeKey,
} from 'lexical';
import { $isToggleBodyNode } from '../../../nodes/ToggleBodyNode';

export type DropPlacement = 'before' | 'after';

// Moves the dragged block, with everything inside it, beside the target block, which may be in another container: the root or an open toggle's body. Runs inside an editor update. A position that leaves the arrangement as it is writes nothing: no node turns dirty, so no history entry and no save follow. A position inside the dragged block itself is no position. A move that happens tags the update so it is its own history entry: undo reverts the drop alone, never the typing before it. A toggle body the move leaves without a block gets one empty paragraph, since a body is never empty.
export const moveBlock = (
  draggedKey: NodeKey,
  targetKey: NodeKey,
  placement: DropPlacement,
): void => {
  const dragged = $getNodeByKey(draggedKey);
  const target = $getNodeByKey(targetKey);
  if (
    dragged === null ||
    target === null ||
    dragged.is(target) ||
    dragged.isParentOf(target)
  ) {
    return;
  }

  const neighbour =
    placement === 'before'
      ? target.getPreviousSibling()
      : target.getNextSibling();
  if (neighbour?.is(dragged)) return;

  $addUpdateTag(HISTORY_PUSH_TAG);
  const previousParent = dragged.getParent();
  if (placement === 'before') {
    target.insertBefore(dragged);
  } else {
    target.insertAfter(dragged);
  }
  if ($isToggleBodyNode(previousParent) && previousParent.isEmpty()) {
    previousParent.append($createParagraphNode());
  }
};
