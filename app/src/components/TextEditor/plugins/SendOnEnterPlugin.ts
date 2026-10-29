import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $createParagraphNode,
  $getRoot,
  CLEAR_HISTORY_COMMAND,
  COMMAND_PRIORITY_BEFORE_EDITOR,
  KEY_ENTER_COMMAND,
} from 'lexical';
import type { FCProps } from '@/types/fcProps.type';

type Props = {
  onSubmit: (value: string) => Promise<boolean>;
};

export const SendOnEnterPlugin: FCProps<Props> = ({ onSubmit }) => {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    const serializeEditorState = () =>
      JSON.stringify(editor.getEditorState().toJSON());

    const send = async () => {
      const sent = serializeEditorState();
      const wasSent = await onSubmit(sent);
      // Text typed while the write was pending is kept: clearing then would swallow it.
      if (wasSent && serializeEditorState() === sent) {
        editor.update(() => {
          const root = $getRoot();
          root.clear();
          root.append($createParagraphNode());
        });
        editor.dispatchCommand(CLEAR_HISTORY_COMMAND, undefined);
      }
    };

    // The @ list's Enter listener runs first, at COMMAND_PRIORITY_LOW, so a send never preempts picking the highlighted entity; this listener sees only an Enter the list did not take.
    return editor.registerCommand(
      KEY_ENTER_COMMAND,
      (event) => {
        if (event === null || event.shiftKey) {
          return false;
        }
        // A listener returning true does not prevent the default action itself.
        event.preventDefault();
        const isEmpty = editor
          .getEditorState()
          .read(() => $getRoot().getTextContent().trim() === '');
        if (!isEmpty) {
          void send();
        }
        return true;
      },
      COMMAND_PRIORITY_BEFORE_EDITOR,
    );
  }, [editor, onSubmit]);

  return null;
};
