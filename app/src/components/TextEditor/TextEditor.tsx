import { FCProps } from '@/types';
import './TextEditor.css';

import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { HeadingNode } from '@lexical/rich-text';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin';
import { FloatingToolbar } from './components';
import { EditorThemeClasses } from 'lexical';

type Props = object;

const theme: EditorThemeClasses = {
  text: {
    bold: 'text-bold',
    italic: 'text-italic',
  },
};

const initialConfig = {
  namespace: 'Adventure',
  theme,
  onError: (err: any) => console.log(err),
  nodes: [HeadingNode],
};

export const TextEditor: FCProps<Props> = ({ ...props }) => {
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

        <FloatingToolbar />
      </div>
    </LexicalComposer>
  );
};
