import { act, fireEvent, render, screen } from '@testing-library/react';
import { useEffect } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  COMMAND_PRIORITY_LOW,
  KEY_ENTER_COMMAND,
  UNDO_COMMAND,
  type LexicalEditor,
} from 'lexical';
import { SendOnEnterPlugin } from '../SendOnEnterPlugin';

type EditorHandleProps = { onEditor: (editor: LexicalEditor) => void };

const EditorHandle = ({ onEditor }: EditorHandleProps) => {
  const [editor] = useLexicalComposerContext();
  useEffect(() => {
    onEditor(editor);
  }, [editor, onEditor]);
  return null;
};

const mount = (onSubmit: (value: string) => Promise<boolean>) => {
  let editor: LexicalEditor | null = null;
  const tree = (currentOnSubmit: typeof onSubmit) => (
    // eslint-disable-next-line @typescript-eslint/no-deprecated -- the same LexicalComposer TextEditor mounts, whose initialConfig the plugin runs under
    <LexicalComposer
      initialConfig={{
        namespace: 'send-on-enter-test',
        nodes: [],
        onError: (error: Error) => {
          throw error;
        },
      }}
    >
      <RichTextPlugin
        contentEditable={<ContentEditable />}
        placeholder={null}
        ErrorBoundary={LexicalErrorBoundary}
      />
      <HistoryPlugin />
      <SendOnEnterPlugin onSubmit={currentOnSubmit} />
      <EditorHandle
        onEditor={(mounted) => {
          editor = mounted;
        }}
      />
    </LexicalComposer>
  );
  const { rerender } = render(tree(onSubmit));
  const mountedEditor = editor as LexicalEditor | null;
  if (mountedEditor === null) {
    throw new Error('The editor handle did not report the editor');
  }
  return {
    editor: mountedEditor,
    replaceOnSubmit: (next: typeof onSubmit) => {
      rerender(tree(next));
    },
  };
};

const setText = (editor: LexicalEditor, text: string) => {
  act(() => {
    editor.update(
      () => {
        const paragraph = $createParagraphNode();
        paragraph.append($createTextNode(text));
        $getRoot().clear().append(paragraph);
        paragraph.selectEnd();
      },
      { discrete: true },
    );
  });
};

const readText = (editor: LexicalEditor) =>
  editor.getEditorState().read(() => $getRoot().getTextContent());
const readParagraphCount = (editor: LexicalEditor) =>
  editor.getEditorState().read(() => $getRoot().getChildrenSize());

// Resolves to false when a handler prevented the default action, as dispatchEvent does.
const pressEnter = async (shiftKey = false) => {
  let notPrevented = true;
  await act(async () => {
    notPrevented = fireEvent.keyDown(screen.getByRole('textbox'), {
      key: 'Enter',
      keyCode: 13,
      shiftKey,
    });
    await Promise.resolve();
  });
  return notPrevented;
};

describe('SendOnEnterPlugin', () => {
  it('sends the serialised state once on Enter with text and prevents the default action', async () => {
    const onSubmit = vi.fn<(value: string) => Promise<boolean>>();
    onSubmit.mockResolvedValue(true);
    const { editor } = mount(onSubmit);
    setText(editor, 'hello');
    const expected = JSON.stringify(editor.getEditorState().toJSON());
    const notPrevented = await pressEnter();

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith(expected);
    expect(notPrevented).toBe(false);
  });

  it('does not send on Shift+Enter', async () => {
    const onSubmit = vi.fn<(value: string) => Promise<boolean>>();
    const { editor } = mount(onSubmit);
    setText(editor, 'hello');

    await pressEnter(true);

    expect(onSubmit).not.toHaveBeenCalled();
    expect(readText(editor)).toBe('hello\n');
  });

  it('leaves Enter to a LOW-priority listener that takes it, as the @ list does, and sends once that listener passes', async () => {
    const onSubmit = vi.fn<(value: string) => Promise<boolean>>();
    onSubmit.mockResolvedValue(true);
    const { editor } = mount(onSubmit);
    setText(editor, 'hello');
    let takesEnter = true;
    editor.registerCommand(
      KEY_ENTER_COMMAND,
      () => takesEnter,
      COMMAND_PRIORITY_LOW,
    );

    await pressEnter();
    expect(onSubmit).not.toHaveBeenCalled();

    takesEnter = false;
    await pressEnter();
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('does nothing and does not throw for an Enter dispatched without an event', async () => {
    const onSubmit = vi.fn<(value: string) => Promise<boolean>>();
    const { editor } = mount(onSubmit);
    setText(editor, 'hello');

    await act(async () => {
      editor.dispatchCommand(KEY_ENTER_COMMAND, null);
      await Promise.resolve();
    });

    expect(onSubmit).not.toHaveBeenCalled();
    expect(readParagraphCount(editor)).toBe(2);
  });

  it.each(['', '   '])(
    'sends nothing and still prevents the default action for the content %j',
    async (text) => {
      const onSubmit = vi.fn<(value: string) => Promise<boolean>>();
      const { editor } = mount(onSubmit);
      setText(editor, text);
      const notPrevented = await pressEnter();

      expect(onSubmit).not.toHaveBeenCalled();
      expect(notPrevented).toBe(false);
    },
  );

  it('empties the editor once the send resolves true and keeps the text when it resolves false', async () => {
    const onSubmit = vi.fn<(value: string) => Promise<boolean>>();
    const { editor } = mount(onSubmit);
    setText(editor, 'kept');
    onSubmit.mockResolvedValue(false);

    await pressEnter();
    expect(readText(editor)).toBe('kept');
    expect(readParagraphCount(editor)).toBe(1);

    onSubmit.mockResolvedValue(true);
    await pressEnter();
    expect(readText(editor)).toBe('');
    expect(readParagraphCount(editor)).toBe(1);
  });

  it('forgets the sent text in the undo history', async () => {
    const onSubmit = vi.fn<(value: string) => Promise<boolean>>();
    onSubmit.mockResolvedValue(true);
    const { editor } = mount(onSubmit);
    setText(editor, 'sent');

    await pressEnter();
    act(() => {
      editor.dispatchCommand(UNDO_COMMAND, undefined);
    });

    expect(readText(editor)).toBe('');
  });

  it('sends through the onSubmit it was last given', async () => {
    const first = vi.fn<(value: string) => Promise<boolean>>();
    const second = vi.fn<(value: string) => Promise<boolean>>();
    second.mockResolvedValue(false);
    const { editor, replaceOnSubmit } = mount(first);
    setText(editor, 'hello');

    replaceOnSubmit(second);
    await pressEnter();

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });

  it('keeps text typed while the send is pending', async () => {
    const pending = Promise.withResolvers<boolean>();
    const onSubmit = vi.fn<(value: string) => Promise<boolean>>();
    onSubmit.mockReturnValue(pending.promise);
    const { editor } = mount(onSubmit);
    setText(editor, 'first');

    await pressEnter();
    setText(editor, 'first and more');
    await act(async () => {
      pending.resolve(true);
      await pending.promise;
    });

    expect(readText(editor)).toBe('first and more');
  });
});
