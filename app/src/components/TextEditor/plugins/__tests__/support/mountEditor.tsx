import { act, render } from '@testing-library/react';
import type { ReactNode } from 'react';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import type { LexicalEditor } from 'lexical';
import { EditorHandle } from './EditorHandle';
import { TOGGLE_TEST_NODES, throwOnError } from './toggleFixtures';

// Mounts the plugins under the same LexicalComposer and RichTextPlugin the text editor uses, holding the saved state `initialState` (a JSON string) or an empty one, and returns the editor so a test drives it through commands and updates.
export const mountEditor = (
  plugins: ReactNode,
  initialState: string | null = null,
): LexicalEditor => {
  let editor: LexicalEditor | null = null;
  render(
    // eslint-disable-next-line @typescript-eslint/no-deprecated -- the same LexicalComposer TextEditor mounts, whose initialConfig the plugins run under
    <LexicalComposer
      initialConfig={{
        namespace: 'toggle-plugin-test',
        nodes: TOGGLE_TEST_NODES,
        editorState: initialState,
        onError: throwOnError,
      }}
    >
      <RichTextPlugin
        contentEditable={<ContentEditable />}
        placeholder={null}
        ErrorBoundary={LexicalErrorBoundary}
      />
      {plugins}
      <EditorHandle
        onEditor={(mounted) => {
          editor = mounted;
        }}
      />
    </LexicalComposer>,
  );
  const mountedEditor = editor as LexicalEditor | null;
  if (mountedEditor === null) {
    throw new Error('The editor handle did not report the editor');
  }
  return mountedEditor;
};

// An update a test makes after the mount, inside act so React flushes what the plugins did in reaction.
export const updateEditor = (editor: LexicalEditor, update: () => void) => {
  act(() => {
    editor.update(update, { discrete: true });
  });
};
