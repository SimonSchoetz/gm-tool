import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $createParagraphNode,
  $getSelection,
  $isParagraphNode,
  $isRangeSelection,
} from 'lexical';
import { $isHeadingNode } from '@lexical/rich-text';
import { ToggleNode } from '../../nodes';
import { collectContentNodes } from './helper';

export const ToggleHeaderGuardPlugin = (): null => {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerNodeTransform(ToggleNode, (toggleNode) => {
      const firstChild = toggleNode.getFirstChild();
      if (!firstChild) return;
      if ($isParagraphNode(firstChild) || $isHeadingNode(firstChild)) return;

      const selection = $getSelection();
      const preservesCaret =
        $isRangeSelection(selection) &&
        firstChild.isParentOf(selection.anchor.getNode());

      const contentNodes = collectContentNodes(firstChild);
      const paragraph = $createParagraphNode();
      firstChild.replace(paragraph);
      paragraph.append(...contentNodes);

      if (preservesCaret) {
        paragraph.selectEnd();
      }
    });
  }, [editor]);

  return null;
};
