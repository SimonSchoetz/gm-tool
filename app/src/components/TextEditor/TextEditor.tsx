import { FCProps } from '@/types';
import './TextEditor.css';

import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { HeadingNode } from '@lexical/rich-text';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { FloatingToolbar } from './components';
import { EditorThemeClasses, EditorState } from 'lexical';
import { useState } from 'react';

type Props = {
  value: string;
  textEditorId: string;
  onChange: (value: string) => void;
};

const theme: EditorThemeClasses = {
  text: {
    bold: 'text-bold',
    italic: 'text-italic',
  },
  heading: {
    h1: 'editor-heading-h1',
    h2: 'editor-heading-h2',
    h3: 'editor-heading-h3',
  },
};

export const TextEditor: FCProps<Props> = ({
  value,
  textEditorId,
  onChange,
  ...props
}) => {
  const [isFirstRender, setIsFirstRender] = useState(true);

  const initialConfig = {
    namespace: textEditorId,
    theme,
    onError: (err: any) => console.error('Lexical error:', err),
    nodes: [HeadingNode],
    editorState: value || undefined,
  };

  const handleChange = (editorState: EditorState) => {
    // Skip onChange on first render to avoid triggering update with initial value
    if (isFirstRender) {
      setIsFirstRender(false);
      return;
    }

    if (onChange) {
      const json = JSON.stringify(editorState.toJSON());
      onChange(json);
    }
  };

  return (
    <LexicalComposer initialConfig={initialConfig} {...props}>
      <div className='text-editor'>
        <RichTextPlugin
          contentEditable={<ContentEditable className='editor-content' />}
          placeholder={<div className='placeholder'>Description...</div>}
          ErrorBoundary={LexicalErrorBoundary}
        />

        <HistoryPlugin />
        <AutoFocusPlugin />
        <OnChangePlugin onChange={handleChange} />

        <FloatingToolbar />
      </div>
    </LexicalComposer>
  );
};
