import {
  $addUpdateTag,
  $getNodeByKey,
  HISTORY_PUSH_TAG,
  type NodeKey,
} from 'lexical';

export type DropPlacement = 'before' | 'after';

// Moves the dragged top-level block beside the target block. Runs inside an editor update. A position that leaves the order as it is writes nothing: no node turns dirty, so no history entry and no save follow. A move that happens tags the update so it is its own history entry: undo reverts the drop alone, never the typing before it.
export const moveBlock = (
  draggedKey: NodeKey,
  targetKey: NodeKey,
  placement: DropPlacement,
): void => {
  const dragged = $getNodeByKey(draggedKey);
  const target = $getNodeByKey(targetKey);
  if (dragged === null || target === null || dragged.is(target)) return;

  const neighbour =
    placement === 'before'
      ? target.getPreviousSibling()
      : target.getNextSibling();
  if (neighbour?.is(dragged)) return;

  $addUpdateTag(HISTORY_PUSH_TAG);
  if (placement === 'before') {
    target.insertBefore(dragged);
  } else {
    target.insertAfter(dragged);
  }
};
