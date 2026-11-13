import {
  $createListItemNode,
  $createListNode,
  $isListItemNode,
  $isListNode,
} from '@lexical/list';
import type { ListItemNode, ListType } from '@lexical/list';
import { $createParagraphNode } from 'lexical';
import type { LexicalNode } from 'lexical';
import type { DropPlacement } from './moveBlock';
import { removeListUnit } from './removeListUnit';
import { subListOf } from './subListOf';
import { wrapperAfter } from './wrapperAfter';

// The sub-items of an item in document order, each with its depth below the item.
const subItems = (
  item: ListItemNode,
  depth: number,
): { item: ListItemNode; depth: number }[] =>
  subListOf(wrapperAfter(item))
    ?.getChildren()
    .flatMap((child) =>
      $isListItemNode(child) && subListOf(child) === null
        ? [{ item: child, depth }, ...subItems(child, depth + 1)]
        : [],
    ) ?? [];

// Turns a list item that leaves every list into a paragraph beside `target`, taking over the item's children so its text and inline formatting stay, and removes the item. The item's sub-items follow the paragraph as a list of the item's own style, each one level shallower than before; their check states stay. A check state of the item itself is dropped.
export const convertListUnitToParagraph = (
  item: ListItemNode,
  target: LexicalNode,
  placement: DropPlacement,
): void => {
  const sourceList = item.getParent();
  const style: ListType = $isListNode(sourceList)
    ? sourceList.getListType()
    : 'bullet';
  const paragraph = $createParagraphNode();
  paragraph.append(...item.getChildren());
  const rebuilt = subItems(item, 1).map((sub) => {
    const copy = $createListItemNode(sub.item.getChecked());
    copy.append(...sub.item.getChildren());
    return { item: copy, depth: sub.depth };
  });

  // The paragraph goes in before the item is removed: the target may be the item's own list, which Lexical removes with its last item.
  if (placement === 'before') {
    target.insertBefore(paragraph);
  } else {
    target.insertAfter(paragraph);
  }
  if (rebuilt.length > 0) {
    const subList = $createListNode(style);
    paragraph.insertAfter(subList);
    subList.append(...rebuilt.map(({ item: copy }) => copy));
    rebuilt.forEach(({ item: copy, depth }) => {
      copy.setIndent(depth - 1);
    });
  }
  removeListUnit(item);
};
