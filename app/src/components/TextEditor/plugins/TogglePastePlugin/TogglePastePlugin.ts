import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $addUpdateTag,
  $getSelection,
  $isElementNode,
  $isRangeSelection,
  COMMAND_PRIORITY_LOW,
  mergeRegister,
  PASTE_COMMAND,
  PASTE_TAG,
  SELECTION_INSERT_CLIPBOARD_NODES_COMMAND,
  type BaseSelection,
  type ElementNode,
  type LexicalNode,
} from 'lexical';
import { insertBlocksBehindHeader } from './helper/insertBlocksBehindHeader';
import { plainTextToBlocks } from './helper/plainTextToBlocks';

const LEXICAL_MIME_TYPE = 'application/x-lexical-editor';
const HTML_MIME_TYPE = 'text/html';

export const TogglePastePlugin = (): null => {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    // The lexical and HTML importers dispatch this command before they insert, and a listener that returns true skips their insertion.
    const handleClipboardNodes = ({
      nodes,
      selection,
    }: {
      nodes: LexicalNode[];
      selection: BaseSelection;
    }): boolean => {
      if (!$isRangeSelection(selection)) return false;
      const blocks = nodes.filter(
        (node): node is ElementNode => $isElementNode(node) && !node.isInline(),
      );
      if (blocks.length !== nodes.length) return false;
      return insertBlocksBehindHeader(selection, blocks);
    };

    // The editor's plain-text import splits a paste at every line break with a paragraph split, which next to a header adds a second header block, and it never dispatches the command above. A text of one line makes one paragraph, which insertBlocksBehindHeader leaves to the editor.
    const handlePaste = (event: Event): boolean => {
      if (!('clipboardData' in event)) return false;
      const clipboardData = event.clipboardData as DataTransfer | null;
      if (clipboardData === null) return false;
      const { types } = clipboardData;
      if (types.includes(LEXICAL_MIME_TYPE) || types.includes(HTML_MIME_TYPE)) {
        return false;
      }
      const text = clipboardData.getData('text/plain');

      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return false;
      if (!insertBlocksBehindHeader(selection, plainTextToBlocks(text))) {
        return false;
      }
      $addUpdateTag(PASTE_TAG);
      event.preventDefault();
      return true;
    };

    return mergeRegister(
      editor.registerCommand(
        SELECTION_INSERT_CLIPBOARD_NODES_COMMAND,
        handleClipboardNodes,
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand(PASTE_COMMAND, handlePaste, COMMAND_PRIORITY_LOW),
    );
  }, [editor]);

  return null;
};
