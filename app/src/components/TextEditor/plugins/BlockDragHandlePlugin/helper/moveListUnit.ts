import { $createListItemNode, $isListItemNode } from '@lexical/list';
import type { ListItemNode } from '@lexical/list';
import type { ParagraphNode } from 'lexical';
import { convertToListItem } from './convertToListItem';
import type { DropPlacement } from './moveBlock';
import { removeListUnit } from './removeListUnit';
import { subListOf } from './subListOf';
import { wrapperAfter } from './wrapperAfter';

// The unit's real items in document order, each with its depth relative to the unit's own item; a nesting wrapper is read with the item before it.
const unitItems = (
  item: ListItemNode,
  relativeDepth: number,
): { item: ListItemNode; relativeDepth: number }[] => [
  { item, relativeDepth },
  ...(subListOf(wrapperAfter(item))
    ?.getChildren()
    .flatMap((child) =>
      $isListItemNode(child) && subListOf(child) === null
        ? unitItems(child, relativeDepth + 1)
        : [],
    ) ?? []),
];

// Whether the unit already stands where the move would put it: directly before the target item, or directly after the target's own unit. A paragraph stands in no list.
const isAlreadyThere = (
  dragged: ParagraphNode | ListItemNode,
  target: ListItemNode,
  placement: DropPlacement,
  depth: number,
): boolean =>
  placement === 'before'
    ? target.getPreviousSibling()?.is(wrapperAfter(dragged) ?? dragged) === true
    : depth <= target.getIndent() &&
      (wrapperAfter(target) ?? target).getNextSibling()?.is(dragged) === true;

// Moves a paragraph, or a list item with all its sub-items, into the list that `target` is an item of: before the item, or after it at the same depth (after the item's own sub-items), or, with a depth one deeper than the item's, as its first child. The unit's items are rebuilt as items of the destination list, each at the chosen depth plus its depth relative to the unit's, with their text and inline formatting; each keeps its check state as its own, and the destination list drops it unless the list is a check list. Writes nothing when the unit is already there.
export const moveListUnit = (
  dragged: ParagraphNode | ListItemNode,
  target: ListItemNode,
  placement: DropPlacement,
  depth: number,
): void => {
  if (isAlreadyThere(dragged, target, placement, depth)) return;

  const [first, ...rest] = $isListItemNode(dragged)
    ? unitItems(dragged, 0).map(({ item, relativeDepth }) => {
        const rebuilt = $createListItemNode(item.getChecked());
        rebuilt.append(...item.getChildren());
        return { item: rebuilt, relativeDepth };
      })
    : [{ item: convertToListItem(dragged), relativeDepth: 0 }];
  removeListUnit(dragged);

  if (placement === 'before') {
    target.insertBefore(first.item);
  } else {
    const anchor =
      depth <= target.getIndent() ? (wrapperAfter(target) ?? target) : target;
    anchor.insertAfter(first.item);
  }
  first.item.setIndent(depth);
  let previous = first.item;
  for (const member of rest) {
    previous.insertAfter(member.item);
    member.item.setIndent(depth + member.relativeDepth);
    previous = member.item;
  }
};
