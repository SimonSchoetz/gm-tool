import { $isListItemNode } from '@lexical/list';
import type { LexicalNode } from 'lexical';
import { wrapperAfter } from './wrapperAfter';

// Removes a paragraph, or a list item with its sub-items. When the item was the last of a nested list, Lexical removes the emptied list but leaves the nesting wrapper that held it as an empty list item, so that goes too.
export const removeListUnit = (node: LexicalNode): void => {
  const parentWrapper = node.getParentOrThrow().getParent();
  wrapperAfter(node)?.remove();
  node.remove();
  if ($isListItemNode(parentWrapper) && parentWrapper.isEmpty()) {
    parentWrapper.remove();
  }
};
