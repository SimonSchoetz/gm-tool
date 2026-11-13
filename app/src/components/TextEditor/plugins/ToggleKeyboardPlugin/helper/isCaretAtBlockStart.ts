import type { ElementNode, LexicalNode, RangeSelection } from 'lexical';

// A point's offset is relative to its own node, so the caret is at the start of the block only when it is at offset zero of that node and no node on the way up to the block has a previous sibling.
export const isCaretAtBlockStart = (
  selection: RangeSelection,
  block: ElementNode,
): boolean => {
  const node = selection.anchor.getNode();
  if (selection.anchor.offset !== 0) return false;

  let current: LexicalNode = node;
  while (!current.is(block)) {
    if (current.getPreviousSibling() !== null) return false;
    current = current.getParentOrThrow();
  }
  return true;
};
