import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import type { LexicalEditor } from 'lexical';

type Props = { onEditor: (editor: LexicalEditor) => void };

// Reports the editor of the surrounding LexicalComposer, which a test mounted around plugins has no other way to reach.
export const EditorHandle = ({ onEditor }: Props) => {
  const [editor] = useLexicalComposerContext();
  useEffect(() => {
    onEditor(editor);
  }, [editor, onEditor]);
  return null;
};
