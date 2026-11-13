import type { ElementNode, RangeSelection } from 'lexical';
import { $createHeadingNode, $isHeadingNode } from '@lexical/rich-text';
import { $isToggleBodyNode } from '../nodes/ToggleBodyNode';
import { $isToggleNode } from '../nodes/ToggleNode';
import { resolveTopLevelBlock } from './resolveTopLevelBlock';

// Splits the toggle header the caret is in at the caret and returns the block holding the text after it. The editor's split puts that block next to the header inside the toggle, a second header; it is moved to where Enter at the end of a header leads: the start of the body of an open toggle, directly after a collapsed toggle.
export const splitHeaderAtSelection = (
  selection: RangeSelection,
): ElementNode => {
  const header = resolveTopLevelBlock(selection.anchor.getNode());
  const toggle = header.getParent();
  if (!$isToggleNode(toggle)) {
    throw new Error(
      'splitHeaderAtSelection: the caret is not in a toggle header',
    );
  }

  const newBlock = selection.insertParagraph();
  // insertParagraph returns null only for a code block or a slot host, never for the paragraph or heading a toggle header is.
  if (newBlock === null) {
    throw new Error('splitHeaderAtSelection: the header could not be split');
  }

  // A split with the caret at the start of a heading replaces the emptied heading with a paragraph, which would leave the toggle without its heading header.
  const currentHeader = toggle.getFirstChildOrThrow();
  if ($isHeadingNode(header) && !$isHeadingNode(currentHeader)) {
    currentHeader.replace($createHeadingNode(header.getTag()));
  }

  const body = toggle.getLastChild();
  if (toggle.isCollapsed() || !$isToggleBodyNode(body)) {
    toggle.insertAfter(newBlock);
    return newBlock;
  }
  const firstBodyBlock = body.getFirstChild();
  if (firstBodyBlock === null) {
    body.append(newBlock);
  } else {
    firstBodyBlock.insertBefore(newBlock);
  }
  return newBlock;
};
