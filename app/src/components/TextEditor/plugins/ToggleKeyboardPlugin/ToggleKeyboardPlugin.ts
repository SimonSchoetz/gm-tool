import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $createParagraphNode,
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_LOW,
  KEY_BACKSPACE_COMMAND,
  KEY_DELETE_COMMAND,
  KEY_ENTER_COMMAND,
  mergeRegister,
} from 'lexical';
import { $isToggleBodyNode, $isToggleNode } from '../../nodes';
import { resolveTopLevelBlock } from '../../helper';
import { resolveHeaderToggleForRemoval } from './helper';

export const ToggleKeyboardPlugin = (): null => {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    const handleEnter = (): boolean => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
        return false;
      }

      const anchorNode = selection.anchor.getNode();
      const block = resolveTopLevelBlock(anchorNode);
      const parent = block.getParent();

      if (
        $isToggleBodyNode(parent) &&
        block.getTextContent().length === 0 &&
        block.is(parent.getLastChild())
      ) {
        const toggleNode = parent.getParent();
        if (!$isToggleNode(toggleNode)) return false;
        block.remove();
        toggleNode.insertAfter(block);
        block.selectStart();
        return true;
      }

      if ($isToggleNode(parent)) {
        const isAtEnd = selection.anchor.offset === block.getTextContentSize();
        if (!isAtEnd) return false;

        if (parent.isCollapsed()) {
          const paragraph = $createParagraphNode();
          parent.insertAfter(paragraph);
          paragraph.selectStart();
          return true;
        }

        const body = parent.getLastChild();
        if (!$isToggleBodyNode(body)) return false;

        let firstBlock = body.getFirstChild();
        if (!firstBlock) {
          firstBlock = $createParagraphNode();
          body.append(firstBlock);
        }
        firstBlock.selectStart();
        return true;
      }

      return false;
    };

    const handleBackspace = (): boolean => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return false;

      if (selection.isCollapsed()) {
        const anchorNode = selection.anchor.getNode();
        const block = resolveTopLevelBlock(anchorNode);
        const parent = block.getParent();
        if ($isToggleNode(parent) && selection.anchor.offset === 0) {
          parent.remove();
          return true;
        }
        return false;
      }

      const headerToggle = resolveHeaderToggleForRemoval(selection);
      if (!headerToggle) return false;
      headerToggle.remove();
      return true;
    };

    const handleDelete = (): boolean => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return false;

      const headerToggle = resolveHeaderToggleForRemoval(selection);
      if (!headerToggle) return false;
      headerToggle.remove();
      return true;
    };

    return mergeRegister(
      editor.registerCommand(
        KEY_ENTER_COMMAND,
        handleEnter,
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand(
        KEY_BACKSPACE_COMMAND,
        handleBackspace,
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand(
        KEY_DELETE_COMMAND,
        handleDelete,
        COMMAND_PRIORITY_LOW,
      ),
    );
  }, [editor]);

  return null;
};
