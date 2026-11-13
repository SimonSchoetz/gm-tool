import { $createParagraphNode, LexicalNode } from 'lexical';
import {
  $createToggleBodyNode,
  $isToggleBodyNode,
} from '../../../nodes/ToggleBodyNode';
import { ToggleNode } from '../../../nodes/ToggleNode';

// A second body among a toggle's children is unwrapped, so no body ends up inside the body.
const blocksOf = (nodes: readonly LexicalNode[]): LexicalNode[] =>
  nodes.flatMap((node) =>
    $isToggleBodyNode(node) ? node.getChildren() : node,
  );

// Every child after the header ends up in the one body, in the order the children had: the blocks before the body, the body's own, then the blocks after it.
export const normalizeToggleChildren = (toggle: ToggleNode): void => {
  const [, ...rest] = toggle.getChildren();
  const existingBody = rest.findLast($isToggleBodyNode) ?? null;
  if (existingBody !== null && rest.length === 1) return;

  const body = existingBody ?? $createToggleBodyNode();
  const blocks = blocksOf(rest);
  toggle.append(body);
  body.append(...blocks);
  if (body.isEmpty()) body.append($createParagraphNode());

  for (const node of rest) {
    if ($isToggleBodyNode(node) && !node.is(body)) node.remove();
  }
};
