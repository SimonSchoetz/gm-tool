import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $createParagraphNode,
  $getSelection,
  $isElementNode,
  $isRangeSelection,
  COMMAND_PRIORITY_BEFORE_EDITOR,
  COMMAND_PRIORITY_LOW,
  KEY_BACKSPACE_COMMAND,
  KEY_DELETE_COMMAND,
  KEY_ENTER_COMMAND,
  mergeRegister,
} from 'lexical';
import { $isToggleBodyNode } from '../../nodes/ToggleBodyNode';
import { $isToggleNode } from '../../nodes/ToggleNode';
import { resolveTopLevelBlock } from '../../helper/resolveTopLevelBlock';
import { isCaretAtBlockEnd } from './helper/isCaretAtBlockEnd';
import { isCaretAtBlockStart } from './helper/isCaretAtBlockStart';
import { resolveHeaderToggleForRemoval } from './helper/resolveHeaderToggleForRemoval';
import { splitHeaderAtSelection } from './helper/splitHeaderAtSelection';

export const ToggleKeyboardPlugin = (): null => {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    const handleEnter = (event: KeyboardEvent | null): boolean => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return false;

      const block = resolveTopLevelBlock(selection.anchor.getNode());
      const parent = block.getParent();

      if ($isToggleNode(parent) && $isElementNode(block)) {
        if (event?.shiftKey) return false;
        const focusBlock = resolveTopLevelBlock(selection.focus.getNode());
        if (!focusBlock.is(block)) return false;
        selection.removeText();

        if (isCaretAtBlockStart(selection, block) && !block.isEmpty()) {
          event?.preventDefault();
          parent.insertBefore($createParagraphNode());
          return true;
        }

        if (!isCaretAtBlockEnd(selection, block)) {
          event?.preventDefault();
          splitHeaderAtSelection(selection).selectStart();
          return true;
        }

        if (parent.isCollapsed()) {
          event?.preventDefault();
          const paragraph = $createParagraphNode();
          parent.insertAfter(paragraph);
          paragraph.selectStart();
          return true;
        }

        const body = parent.getLastChild();
        if (!$isToggleBodyNode(body)) return false;

        event?.preventDefault();
        let firstBlock = body.getFirstChild();
        if (!firstBlock) {
          firstBlock = $createParagraphNode();
          body.append(firstBlock);
        }
        firstBlock.selectStart();
        return true;
      }

      if (
        selection.isCollapsed() &&
        $isToggleBodyNode(parent) &&
        block.getTextContent().length === 0 &&
        block.is(parent.getLastChild())
      ) {
        const toggleNode = parent.getParent();
        if (!$isToggleNode(toggleNode)) return false;
        event?.preventDefault();
        toggleNode.insertAfter(block);
        return true;
      }

      return false;
    };

    const handleBackspace = (event: KeyboardEvent): boolean => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return false;

      if (selection.isCollapsed()) {
        const anchorNode = selection.anchor.getNode();
        const block = resolveTopLevelBlock(anchorNode);
        const parent = block.getParent();
        if ($isToggleNode(parent) && selection.anchor.offset === 0) {
          event.preventDefault();
          parent.remove();
          return true;
        }
        return false;
      }

      const headerToggle = resolveHeaderToggleForRemoval(selection);
      if (!headerToggle) return false;
      event.preventDefault();
      headerToggle.remove();
      return true;
    };

    const handleDelete = (event: KeyboardEvent): boolean => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return false;

      const headerToggle = resolveHeaderToggleForRemoval(selection);
      if (!headerToggle) return false;
      event.preventDefault();
      headerToggle.remove();
      return true;
    };

    return mergeRegister(
      // Below the typeahead menus' listeners, which run at COMMAND_PRIORITY_LOW and take an Enter while a menu is open.
      editor.registerCommand(
        KEY_ENTER_COMMAND,
        handleEnter,
        COMMAND_PRIORITY_BEFORE_EDITOR,
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
