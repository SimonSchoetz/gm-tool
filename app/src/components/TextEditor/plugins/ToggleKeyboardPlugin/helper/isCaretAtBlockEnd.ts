import {
  $isElementNode,
  type ElementNode,
  type LexicalNode,
  type RangeSelection,
} from 'lexical';

const endOffsetOf = (node: LexicalNode): number =>
  $isElementNode(node) ? node.getChildrenSize() : node.getTextContentSize();

// A point's offset is relative to its own node, so the caret is at the end of the block only when it is at the end of that node and no node on the way up to the block has a next sibling.
export const isCaretAtBlockEnd = (
  selection: RangeSelection,
  block: ElementNode,
): boolean => {
  const node = selection.anchor.getNode();
  if (selection.anchor.offset !== endOffsetOf(node)) return false;

  let current: LexicalNode = node;
  while (!current.is(block)) {
    if (current.getNextSibling() !== null) return false;
    current = current.getParentOrThrow();
  }
  return true;
};
