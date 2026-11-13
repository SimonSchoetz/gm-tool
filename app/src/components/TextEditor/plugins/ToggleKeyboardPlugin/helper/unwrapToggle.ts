import { $isElementNode, type ElementNode, type LexicalNode } from 'lexical';
import { $isToggleBodyNode } from '../../../nodes/ToggleBodyNode';
import type { ToggleNode } from '../../../nodes/ToggleNode';

// Turns the toggle into plain blocks at its own level: its header, then the blocks of its body in order. Every block moves as the node it is, so a toggle inside the body stays a toggle and an empty block stays. Returns the header.
export const unwrapToggle = (toggle: ToggleNode): ElementNode => {
  const header = toggle.getFirstChild();
  // Lexical wraps an inline child of a toggle into a paragraph, so the first child of a toggle is always a block.
  if (!$isElementNode(header)) {
    throw new Error('unwrapToggle: the toggle has no header block');
  }
  const body = toggle.getLastChild();
  const bodyBlocks = $isToggleBodyNode(body) ? body.getChildren() : [];

  toggle.insertBefore(header);
  let previous: LexicalNode = header;
  for (const block of bodyBlocks) {
    previous.insertAfter(block);
    previous = block;
  }
  toggle.remove();
  return header;
};
