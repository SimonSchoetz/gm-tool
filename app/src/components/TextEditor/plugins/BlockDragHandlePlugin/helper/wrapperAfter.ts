import { $isListItemNode } from '@lexical/list';
import type { ListItemNode } from '@lexical/list';
import type { LexicalNode } from 'lexical';
import { subListOf } from './subListOf';

// The nesting wrapper that follows a node when the node is a list item with sub-items, null for any other node and for an item with none.
export const wrapperAfter = (node: LexicalNode): ListItemNode | null => {
  const next = node.getNextSibling();
  return $isListItemNode(next) && subListOf(next) !== null ? next : null;
};
