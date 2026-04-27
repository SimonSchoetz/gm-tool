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
import { CheckListPlugin } from '@lexical/react/LexicalCheckListPlugin';
import { TabIndentationPlugin } from '@lexical/react/LexicalTabIndentationPlugin';
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin';
import { UNORDERED_LIST, ORDERED_LIST, CHECK_LIST } from '@lexical/markdown';
import { FloatingToolbar } from './components';
import { MentionTypeaheadPlugin, CheckboxReadOnlyPlugin } from './plugins';
import { EditorThemeClasses, EditorState } from 'lexical';
import { parseSafeEditorState } from './helper';

type Props = {
  value: string;
  textEditorId: string;
  placeholder?: string;
  readOnly?: boolean;
  onChange?: (value: string) => void;
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
    listitemChecked: 'editor-listitem-checked',
    listitemUnchecked: 'editor-listitem-unchecked',
    checklist: 'editor-checklist',
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
  readOnly = false,
  ...props
}) => {
  const initialConfig = {
    namespace: textEditorId,
    theme,
    onError: (err: Error) => {
      console.error('Lexical error:', err);
    },
    nodes: [HeadingNode, ListNode, ListItemNode, MentionNode],
    editorState: value ? parseSafeEditorState(value) : null,
    editable: !readOnly,
  };

  const handleChange = (editorState: EditorState) => {
    if (onChange) {
      onChange(
        editorState.isEmpty() ? '' : JSON.stringify(editorState.toJSON()),
      );
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
        <CheckListPlugin />
        <TabIndentationPlugin />
        <MarkdownShortcutPlugin
          transformers={[UNORDERED_LIST, ORDERED_LIST, CHECK_LIST]}
        />

        {onChange && <OnChangePlugin onChange={handleChange} />}
        {!readOnly && <FloatingToolbar />}
        {!readOnly && <MentionTypeaheadPlugin />}
        {readOnly && <CheckboxReadOnlyPlugin />}
      </div>
    </LexicalComposer>
  );
};
