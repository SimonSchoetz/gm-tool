import { $createListNode } from '@lexical/list';
import type { ListItemNode, ListNode } from '@lexical/list';
import { $createParagraphNode } from 'lexical';
import type { LexicalNode } from 'lexical';
import type { DropPlacement } from './collectBlockRows';
import { rebuildListUnit } from './rebuildListUnit';
import { removeListUnit } from './removeListUnit';

// Turns a list item that leaves every list into a paragraph beside `target`, taking over the item's children so its text and inline formatting stay, and removes the item. The item's sub-items follow the paragraph as a list of the item's own style, each one level shallower than before; their check states stay. A check state of the item itself is dropped.
export const convertListUnitToParagraph = (
  item: ListItemNode,
  target: LexicalNode,
  placement: DropPlacement,
): void => {
  // A list item's parent is always a list.
  const style = (item.getParentOrThrow() as ListNode).getListType();
  const [own, ...subs] = rebuildListUnit(item);
  const paragraph = $createParagraphNode();
  paragraph.append(...own.item.getChildren());
  // The paragraph goes in before the item is removed: the target may be the item's own list, which Lexical removes with its last item.
  if (placement === 'before') {
    target.insertBefore(paragraph);
  } else {
    target.insertAfter(paragraph);
  }
  if (subs.length > 0) {
    const subList = $createListNode(style);
    paragraph.insertAfter(subList);
    subList.append(...subs.map(({ item: copy }) => copy));
    subs.forEach(({ item: copy, relativeDepth }) => {
      copy.setIndent(relativeDepth - 1);
    });
  }
  removeListUnit(item);
};
