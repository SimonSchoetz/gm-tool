import { useState, type CSSProperties } from 'react';
import { FCProps } from '@/types/fcProps.type';
import { HtmlProps } from '@/types/htmlProps.type';
import './TextEditor.css';

import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { HeadingNode } from '@lexical/rich-text';
import { ListNode, ListItemNode } from '@lexical/list';
import { MentionNode } from './nodes/MentionNode';
import { ToggleNode } from './nodes/ToggleNode';
import { ToggleBodyNode } from './nodes/ToggleBodyNode';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { CheckListPlugin } from '@lexical/react/LexicalCheckListPlugin';
import { TabIndentationPlugin } from '@lexical/react/LexicalTabIndentationPlugin';
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin';
import { UNORDERED_LIST, ORDERED_LIST, CHECK_LIST } from '@lexical/markdown';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import { LinkNode } from '@lexical/link';
import { TableNode, TableRowNode, TableCellNode } from '@lexical/table';
import { TablePlugin } from '@lexical/react/LexicalTablePlugin';
import { FloatingToolbar } from './components/FloatingToolbar';
import { BlockDragHandlePlugin } from './plugins/BlockDragHandlePlugin';
import { MentionTypeaheadPlugin } from './plugins/MentionTypeaheadPlugin';
import { CheckboxReadOnlyPlugin } from './plugins/CheckboxReadOnlyPlugin';
import { EmbeddedLinkPlugin } from './plugins/EmbeddedLinkPlugin/EmbeddedLinkPlugin';
import { EmptyNodeHintPlugin } from './plugins/EmptyNodeHintPlugin/EmptyNodeHintPlugin';
import { ExternalValueSyncPlugin } from './plugins/ExternalValueSyncPlugin';
import { MentionFormatPlugin } from './plugins/MentionFormatPlugin/MentionFormatPlugin';
import { SlashCommandPlugin } from './plugins/SlashCommandPlugin';
import { TableCellBackgroundGuardPlugin } from './plugins/TableCellBackgroundGuardPlugin/TableCellBackgroundGuardPlugin';
import { TableEdgeHandlePlugin } from './plugins/TableEdgeHandlePlugin';
import { ToggleGutterPlugin } from './plugins/ToggleGutterPlugin/ToggleGutterPlugin';
import { ToggleHeaderGuardPlugin } from './plugins/ToggleHeaderGuardPlugin';
import { ToggleKeyboardPlugin } from './plugins/ToggleKeyboardPlugin';
import { EditorThemeClasses, EditorState, LexicalEditor } from 'lexical';
import { parseSafeEditorState } from './helper/parseSafeEditorState';
import { EXTERNAL_SYNC_TAG } from './TextEditor.constants';
import { TYPOGRAPHIC_TRANSFORMERS } from './typographicTransformers';
import { cn } from '@/util/className';

type Props = {
  value: string;
  textEditorId: string;
  placeholder?: string;
  readOnly?: boolean;
  onChange?: (value: string) => void;
  className?: HtmlProps<'div'>['className'];
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
  link: 'editor-link',
  table: 'editor-table',
  tableCellHeader: 'editor-table-header',
  tableRow: 'editor-table-row',
  tableCell: 'editor-table-cell',
};

export const TextEditor: FCProps<Props> = ({
  value,
  textEditorId,
  onChange,
  placeholder = 'Description...',
  readOnly = false,
  className,
  ...props
}) => {
  const [anchorElem, setAnchorElem] = useState<HTMLDivElement | null>(null);
  const initialConfig = {
    namespace: textEditorId,
    theme,
    onError: (err: Error) => {
      console.error('Lexical error:', err);
    },
    nodes: [
      HeadingNode,
      ListNode,
      ListItemNode,
      MentionNode,
      LinkNode,
      TableNode,
      TableRowNode,
      TableCellNode,
      ToggleNode,
      ToggleBodyNode,
    ],
    editorState: value ? parseSafeEditorState(value) : null,
    editable: !readOnly,
  };

  const handleChange = (
    editorState: EditorState,
    _editor: LexicalEditor,
    tags: Set<string>,
  ) => {
    // Skip changes the sync plugin applied — re-emitting them would save a peer's value back out and echo it to that device.
    if (tags.has(EXTERNAL_SYNC_TAG)) return;
    if (onChange) {
      onChange(
        editorState.isEmpty() ? '' : JSON.stringify(editorState.toJSON()),
      );
    }
  };

  return (
    <div className={cn('text-editor-container', className)}>
      {/* key={textEditorId} forces a full remount when the caller renders a different entity's field at the same call site (e.g. TanStack Router reusing a screen component across /foe/$foeId param changes) — without it, ExternalValueSyncPlugin's focus-skip guard (correctly there to protect active typing during a same-entity peer sync) can also skip adopting the new entity's value, since a click on an in-text mention link doesn't necessarily blur the contentEditable, leaving the previous entity's content in place and then saving it over the newly-navigated entity on the next selection-driven change. */}
      <LexicalComposer
        key={textEditorId}
        initialConfig={initialConfig}
        {...props}
      >
        <div
          className='text-editor'
          style={
            {
              '--text-editor-gutter-width': readOnly
                ? '0'
                : 'var(--spacing-md)',
            } as CSSProperties
          }
          ref={setAnchorElem}
        >
          <RichTextPlugin
            contentEditable={<ContentEditable className='editor-content' />}
            placeholder={
              <div className='placeholder'>
                {!readOnly ? placeholder : null}
              </div>
            }
            ErrorBoundary={LexicalErrorBoundary}
          />

          <HistoryPlugin />
          <ListPlugin />
          <CheckListPlugin />
          {/* hasCellMerge disabled — insert/delete/move operations assume a regular cell grid */}
          <TablePlugin hasCellMerge={false} />
          <TableCellBackgroundGuardPlugin />
          <TabIndentationPlugin />
          <LinkPlugin />
          <EmbeddedLinkPlugin />
          <MarkdownShortcutPlugin
            transformers={[
              UNORDERED_LIST,
              ORDERED_LIST,
              CHECK_LIST,
              ...TYPOGRAPHIC_TRANSFORMERS,
            ]}
          />

          {onChange && <OnChangePlugin onChange={handleChange} />}
          <ExternalValueSyncPlugin value={value} />
          <ToggleGutterPlugin />
          {!readOnly && <FloatingToolbar />}
          {!readOnly && <MentionTypeaheadPlugin />}
          {!readOnly && <SlashCommandPlugin />}
          {!readOnly && <TableEdgeHandlePlugin />}
          {!readOnly && anchorElem && (
            <BlockDragHandlePlugin anchorElem={anchorElem} />
          )}
          {!readOnly && <MentionFormatPlugin />}
          {!readOnly && <EmptyNodeHintPlugin />}
          {!readOnly && <ToggleKeyboardPlugin />}
          {!readOnly && <ToggleHeaderGuardPlugin />}
          {readOnly && <CheckboxReadOnlyPlugin />}
        </div>
      </LexicalComposer>
    </div>
  );
};
