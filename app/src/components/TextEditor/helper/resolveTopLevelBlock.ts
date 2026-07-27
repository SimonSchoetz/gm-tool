import { DecoratorNode, ElementNode, LexicalNode } from 'lexical';

export const resolveTopLevelBlock = (
  node: LexicalNode,
): LexicalNode | ElementNode | DecoratorNode<unknown> =>
  node.getKey() === 'root' ? node : node.getTopLevelElementOrThrow();
