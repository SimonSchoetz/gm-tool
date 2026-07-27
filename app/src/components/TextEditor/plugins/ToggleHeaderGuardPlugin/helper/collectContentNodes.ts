import { LexicalNode } from 'lexical';
import { $isListItemNode, $isListNode } from '@lexical/list';

export const collectContentNodes = (node: LexicalNode): LexicalNode[] => {
  if ($isListNode(node) || $isListItemNode(node)) {
    return node.getChildren().flatMap(collectContentNodes);
  }
  return [node];
};
