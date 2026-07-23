import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $createParagraphNode, $getRoot } from 'lexical';
import type { FCProps } from '@/types';
import { parseSafeEditorState } from '../helper';
import { EXTERNAL_SYNC_TAG } from '../TextEditor.constants';

type Props = {
  value: string;
};

// Lexical is uncontrolled after mount: initialConfig reads `value` once and every later prop change is ignored, which is what keeps local typing free of cursor jank. This plugin closes the single gap that leaves — a value changed externally (a synced edit arriving from a paired device) reaching an already-mounted editor. It writes the incoming value in only when the editor is not focused, so it never interrupts active local typing, and only when the content actually differs. The write carries EXTERNAL_SYNC_TAG so handleChange skips it and the applied value is not re-emitted as a local save.
export const ExternalValueSyncPlugin: FCProps<Props> = ({ value }) => {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    const root = editor.getRootElement();
    const isFocused = root?.contains(document.activeElement) ?? false;
    if (isFocused) return;

    const currentState = editor.getEditorState();
    const currentValue = currentState.isEmpty()
      ? ''
      : JSON.stringify(currentState.toJSON());
    if (value === currentValue) return;

    const safeValue = parseSafeEditorState(value);
    if (safeValue === null) {
      editor.update(
        () => {
          const rootNode = $getRoot();
          rootNode.clear();
          rootNode.append($createParagraphNode());
        },
        { tag: EXTERNAL_SYNC_TAG },
      );
      return;
    }

    editor.setEditorState(editor.parseEditorState(safeValue), {
      tag: EXTERNAL_SYNC_TAG,
    });
  }, [value, editor]);

  return null;
};
