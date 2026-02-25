import { FCProps } from '@/types';
import './TextEditor.css';

import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { HeadingNode } from '@lexical/rich-text';
import { ListNode, ListItemNode } from '@lexical/list';
import { MentionNode } from './nodes';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { TabIndentationPlugin } from '@lexical/react/LexicalTabIndentationPlugin';
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin';
import { UNORDERED_LIST, ORDERED_LIST } from '@lexical/markdown';
import { FloatingToolbar } from './components';
import { EditorThemeClasses, EditorState } from 'lexical';
import { useState } from 'react';

type Props = {
  value: string;
  textEditorId: string;
  placeholder?: string;
  onChange: (value: string) => void;
};

const theme: EditorThemeClasses = {
  text: {
    bold: 'text-bold',
    italic: 'text-italic',
    underline: 'text-underline',
    strikethrough: 'text-strikethrough',
  },
  heading: {
    h1: 'editor-heading-h1',
    h2: 'editor-heading-h2',
    h3: 'editor-heading-h3',
  },
  list: {
    ul: 'editor-list-ul',
    ol: 'editor-list-ol',
    listitem: 'editor-list-item',
    nested: {
      listitem: 'editor-nested-list-item',
    },
  },
  mention: 'editor-mention',
};

export const TextEditor: FCProps<Props> = ({
  value,
  textEditorId,
  onChange,
  placeholder = 'Description...',
  ...props
}) => {
  const [isFirstRender, setIsFirstRender] = useState(true);

  const initialConfig = {
    namespace: textEditorId,
    theme,
    onError: (err: any) => console.error('Lexical error:', err),
    nodes: [HeadingNode, ListNode, ListItemNode, MentionNode],
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
          placeholder={<div className='placeholder'>{placeholder}</div>}
          ErrorBoundary={LexicalErrorBoundary}
        />

        <HistoryPlugin />
        <ListPlugin />
        <TabIndentationPlugin />
        <MarkdownShortcutPlugin transformers={[UNORDERED_LIST, ORDERED_LIST]} />
        <OnChangePlugin onChange={handleChange} />

        <FloatingToolbar />
      </div>
    </LexicalComposer>
  );
};
