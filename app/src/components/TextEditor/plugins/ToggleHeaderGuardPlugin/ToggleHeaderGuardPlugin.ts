import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $createParagraphNode,
  $getSelection,
  $isParagraphNode,
  $isRangeSelection,
  LexicalNode,
} from 'lexical';
import { $isHeadingNode } from '@lexical/rich-text';
import { $isListItemNode, $isListNode } from '@lexical/list';
import { ToggleNode } from '../../nodes';

const collectContentNodes = (node: LexicalNode): LexicalNode[] => {
  if ($isListNode(node) || $isListItemNode(node)) {
    return node.getChildren().flatMap(collectContentNodes);
  }
  return [node];
};

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
