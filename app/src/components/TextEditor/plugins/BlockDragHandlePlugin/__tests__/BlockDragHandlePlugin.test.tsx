import { act, fireEvent, render, screen } from '@testing-library/react';
import { useEffect, useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
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
  UNDO_COMMAND,
  type LexicalEditor,
} from 'lexical';
import { BlockDragHandlePlugin } from '../BlockDragHandlePlugin';

type EditorHandleProps = { onEditor: (editor: LexicalEditor) => void };

const EditorHandle = ({ onEditor }: EditorHandleProps) => {
  const [editor] = useLexicalComposerContext();
  useEffect(() => {
    onEditor(editor);
  }, [editor, onEditor]);
  return null;
};

type HarnessProps = { onEditor: (editor: LexicalEditor) => void };

const Harness = ({ onEditor }: HarnessProps) => {
  const [anchor, setAnchor] = useState<HTMLDivElement | null>(null);
  return (
    // eslint-disable-next-line @typescript-eslint/no-deprecated -- the same LexicalComposer TextEditor mounts, whose initialConfig the plugin runs under
    <LexicalComposer
      initialConfig={{
        namespace: 'block-drag-handle-test',
        nodes: [],
        onError: (error: Error) => {
          throw error;
        },
      }}
    >
      <div ref={setAnchor}>
        <RichTextPlugin
          contentEditable={<ContentEditable />}
          placeholder={null}
          ErrorBoundary={LexicalErrorBoundary}
        />
        <HistoryPlugin />
        <EditorHandle onEditor={onEditor} />
        {anchor && <BlockDragHandlePlugin anchorElem={anchor} />}
      </div>
    </LexicalComposer>
  );
};

// jsdom computes no layout, so each block gets a stubbed rectangle: 20 units tall, 4 apart, the first at the top.
const ROW_HEIGHT = 20;
const ROW_GAP = 4;
const rowTop = (index: number) => index * (ROW_HEIGHT + ROW_GAP);

const mount = (texts: string[]) => {
  let mountedEditor: LexicalEditor | null = null;
  const { container } = render(
    <Harness
      onEditor={(editor) => {
        mountedEditor = editor;
      }}
    />,
  );
  const editor = mountedEditor as LexicalEditor | null;
  if (editor === null) throw new Error('The editor handle did not report');
  act(() => {
    editor.update(
      () => {
        const root = $getRoot().clear();
        texts.forEach((text) =>
          root.append($createParagraphNode().append($createTextNode(text))),
        );
      },
      { discrete: true },
    );
  });
  const keys = editor.read('latest', () => $getRoot().getChildrenKeys());
  keys.forEach((key, index) => {
    const element = editor.getElementByKey(key);
    if (element === null) throw new Error('block not rendered');
    element.getBoundingClientRect = () =>
      ({
        top: rowTop(index),
        bottom: rowTop(index) + ROW_HEIGHT,
        height: ROW_HEIGHT,
      }) as DOMRect;
  });
  const anchor = container.firstElementChild;
  if (anchor === null) throw new Error('anchor not rendered');
  return { editor, anchor, root: screen.getByRole('textbox') };
};

// The saved document: the text of each top-level block, in order.
const savedOrder = (editor: LexicalEditor): string[] =>
  editor
    .getEditorState()
    .toJSON()
    .root.children.map((block) =>
      'children' in block
        ? (block.children as { text: string }[])
            .map(({ text }) => text)
            .join('')
        : '',
    );

// jsdom has no DragEvent, which Lexical's own drop handler checks for when ours leaves a drop alone, so the global is a mouse event, the pointer position being what the handlers read.
class TestDragEvent extends MouseEvent {
  dataTransfer = { getData: () => '', files: [], types: [] };
}

beforeEach(() => {
  vi.stubGlobal('DragEvent', TestDragEvent);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

const dragEvent = (type: 'dragover' | 'drop', clientY: number) =>
  new TestDragEvent(type, { clientY, bubbles: true, cancelable: true });

// Lexical commits an update in a microtask, so the dispatch is awaited inside act.
const dispatchOnRoot = (root: HTMLElement, event: Event) =>
  act(() => {
    root.dispatchEvent(event);
    return Promise.resolve();
  });

const undo = (editor: LexicalEditor) =>
  act(() => {
    editor.dispatchCommand(UNDO_COMMAND, undefined);
    return Promise.resolve();
  });

const startDragOfBlock = (anchor: Element, blockIndex: number) => {
  fireEvent.mouseMove(anchor, { clientY: rowTop(blockIndex) + 1 });
  const handle = screen.getByLabelText('Drag to move block');
  fireEvent.dragStart(handle, {
    dataTransfer: {
      setData: vi.fn(),
      setDragImage: vi.fn(),
      effectAllowed: '',
    },
  });
  return handle;
};

describe('BlockDragHandlePlugin', () => {
  it('leaves the saved document unchanged after a cancelled drag, and a later drop moves nothing', async () => {
    const { editor, anchor, root } = mount(['a', 'b', 'c']);
    const handle = startDragOfBlock(anchor, 0);
    await dispatchOnRoot(
      root,
      dragEvent('dragover', rowTop(2) + ROW_HEIGHT + 10),
    );

    fireEvent.dragEnd(handle);
    await dispatchOnRoot(root, dragEvent('drop', rowTop(2) + ROW_HEIGHT + 10));

    expect(savedOrder(editor)).toEqual(['a', 'b', 'c']);
  });

  it('leaves the saved document unchanged for a drop on the block’s own position', async () => {
    const { editor, anchor, root } = mount(['a', 'b', 'c']);
    startDragOfBlock(anchor, 1);

    await dispatchOnRoot(root, dragEvent('drop', rowTop(1) + 1));

    expect(savedOrder(editor)).toEqual(['a', 'b', 'c']);
  });

  it('puts the dragged block where it is dropped, and one undo restores the order before the drag', async () => {
    const { editor, anchor, root } = mount(['a', 'b', 'c']);
    startDragOfBlock(anchor, 0);
    const belowLastBlock = rowTop(2) + ROW_HEIGHT + 10;
    await dispatchOnRoot(root, dragEvent('dragover', belowLastBlock));

    await dispatchOnRoot(root, dragEvent('drop', belowLastBlock));
    expect(savedOrder(editor)).toEqual(['b', 'c', 'a']);

    await undo(editor);
    expect(savedOrder(editor)).toEqual(['a', 'b', 'c']);
  });
});
