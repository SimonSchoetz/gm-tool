import type { LexicalNode } from 'lexical';
import { $isListItemNode, $isListNode } from '@lexical/list';
import type { ListNode } from '@lexical/list';

// A nesting wrapper is the list item Lexical makes to hold a sub-list: its first child is that list, and it follows the item whose sub-items the list holds. Returns the list of a wrapper, and null for any other node.
export const subListOf = (node: LexicalNode | null): ListNode | null => {
  if (!$isListItemNode(node)) return null;
  const first = node.getFirstChild();
  return $isListNode(first) ? first : null;
};
