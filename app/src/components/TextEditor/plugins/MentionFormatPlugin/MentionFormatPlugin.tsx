import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  FORMAT_TEXT_COMMAND,
  COMMAND_PRIORITY_LOW,
  $getSelection,
} from 'lexical';
import { $isMentionNode } from '../../nodes';

export const MentionFormatPlugin = () => {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerCommand(
      FORMAT_TEXT_COMMAND,
      (formatType) => {
        const selection = $getSelection();
        if (selection === null) return false;

        selection
          .getNodes()
          .filter($isMentionNode)
          .forEach((node) => node.toggleMentionFormat(formatType));

        return false;
      },
      COMMAND_PRIORITY_LOW,
    );
  }, [editor]);

  return null;
};
