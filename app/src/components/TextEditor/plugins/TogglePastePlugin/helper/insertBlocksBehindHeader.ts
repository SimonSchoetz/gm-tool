import {
  $createParagraphNode,
  $isElementNode,
  $isParagraphNode,
  $isTextNode,
  type ElementNode,
  type LexicalNode,
  type RangeSelection,
} from 'lexical';
import { $isHeadingNode } from '@lexical/rich-text';
import { $isToggleNode } from '../../../nodes/ToggleNode';
import { resolveTopLevelBlock } from '../../../helper/resolveTopLevelBlock';
import { splitHeaderAtSelection } from '../../../helper/splitHeaderAtSelection';

const isTextBlock = (node: LexicalNode): boolean =>
  $isParagraphNode(node) || $isHeadingNode(node);

// Pastes `blocks` at a caret, or over a selection (which the split removes), inside a toggle header so that the header stays one block. A first block that is a paragraph or heading gives its text to the header at the caret; every other block goes where Enter at the end of the header leads (the start of an open toggle's body, directly after a collapsed toggle), in order, and the text that followed the caret ends up at the end of the last block when that is a paragraph or heading, else as a paragraph of its own after it. Returns false, and changes nothing, when the selection is not inside one header or no block would leave the header: the editor's own insertion then runs.
export const insertBlocksBehindHeader = (
  selection: RangeSelection,
  blocks: readonly ElementNode[],
): boolean => {
  const header = resolveTopLevelBlock(selection.anchor.getNode());
  const toggle = header.getParent();
  if (!$isToggleNode(toggle)) return false;
  if (!resolveTopLevelBlock(selection.focus.getNode()).is(header)) return false;

  if (blocks.length === 0) return false;
  const [first, ...others] = blocks;
  const firstGoesToHeader = isTextBlock(first);
  const remaining = firstGoesToHeader ? others : blocks;
  if (remaining.length === 0) return false;

  const tail = splitHeaderAtSelection(selection);
  const currentHeader = toggle.getFirstChild();
  if (firstGoesToHeader && $isElementNode(currentHeader)) {
    currentHeader.append(...first.getChildren());
  }
  for (const block of remaining) {
    tail.insertBefore(block);
  }

  const last = remaining[remaining.length - 1];
  if (isTextBlock(last)) {
    const lastChild = last.getLastChild();
    const joinIndex = last.getChildrenSize();
    last.append(...tail.getChildren());
    tail.remove();
    // A text child needs no caret of its own: the caret the split left at the start of the moved text follows it into the merge of the two text nodes and lands between them. Any other last child needs the caret put on the block after it.
    if (!$isTextNode(lastChild)) last.select(joinIndex, joinIndex);
    return true;
  }

  if (tail.isEmpty()) {
    tail.remove();
  } else {
    tail.replace($createParagraphNode(), true);
  }
  last.selectEnd();
  return true;
};
