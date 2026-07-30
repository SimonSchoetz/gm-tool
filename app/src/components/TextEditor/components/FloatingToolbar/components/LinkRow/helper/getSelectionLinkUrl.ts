import { $getSelection, $isRangeSelection } from 'lexical';
import { $isLinkNode } from '@lexical/link';

export const getSelectionLinkUrl = (): string | null => {
  const selection = $getSelection();
  if (!$isRangeSelection(selection)) return null;
  const nodes = selection.getNodes();
  for (const node of nodes) {
    if ($isLinkNode(node)) return node.getURL();
    const parent = node.getParent();
    if ($isLinkNode(parent)) return parent.getURL();
  }
  return null;
};
