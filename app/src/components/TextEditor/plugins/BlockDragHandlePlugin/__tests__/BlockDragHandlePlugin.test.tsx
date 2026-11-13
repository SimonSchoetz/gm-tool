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
  $getRoot,
  UNDO_COMMAND,
  type LexicalEditor,
  type LexicalNode,
} from 'lexical';
import { $isToggleNode, ToggleNode } from '../../../nodes/ToggleNode';
import {
  $isToggleBodyNode,
  ToggleBodyNode,
} from '../../../nodes/ToggleBodyNode';
import {
  $isListItemNode,
  $isListNode,
  ListItemNode,
  ListNode,
} from '@lexical/list';
import { BlockDragHandlePlugin } from '../BlockDragHandlePlugin';
import {
  list,
  outlineOf,
  paragraph,
  toggle,
} from '../helper/__tests__/support/editorFixtures';

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
        nodes: [ToggleNode, ToggleBodyNode, ListNode, ListItemNode],
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

// jsdom computes no layout, so the blocks get stubbed rectangles. In a flat document each block is 20 units tall, 4 apart, the first at the top and the left edge 16.
const ROW_HEIGHT = 20;
const ROW_GAP = 4;
const ROOT_LEFT = 16;
const rowTop = (index: number) => index * (ROW_HEIGHT + ROW_GAP);

const stubRect = (
  element: HTMLElement | null,
  rect: { top: number; bottom: number; left: number },
) => {
  if (element === null) throw new Error('block not rendered');
  element.getBoundingClientRect = () =>
    ({ ...rect, height: rect.bottom - rect.top }) as DOMRect;
};

const mountDocument = (blocks: () => LexicalNode[]) => {
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
        $getRoot()
          .clear()
          .append(...blocks());
      },
      { discrete: true },
    );
  });
  const anchor = container.firstElementChild;
  if (anchor === null) throw new Error('anchor not rendered');
  return { editor, anchor, root: screen.getByRole('textbox') };
};

const mount = (texts: string[]) => {
  const mounted = mountDocument(() => texts.map(paragraph));
  const keys = mounted.editor.read('latest', () =>
    $getRoot().getChildrenKeys(),
  );
  keys.forEach((key, index) => {
    stubRect(mounted.editor.getElementByKey(key), {
      top: rowTop(index),
      bottom: rowTop(index) + ROW_HEIGHT,
      left: ROOT_LEFT,
    });
  });
  return mounted;
};

// A paragraph "a", an open toggle "T" whose body holds "x" and "y", and a paragraph "c": "a" at 0 to 20, the toggle from 24 to 100 with its header at 24 to 44 and its body's blocks, indented by 32, at 48 to 68 and 70 to 90, and "c" at 104 to 124.
const mountNested = () => {
  const mounted = mountDocument(() => [
    paragraph('a'),
    toggle('T', [paragraph('x'), paragraph('y')]),
    paragraph('c'),
  ]);
  const { editor } = mounted;
  const keys = editor.read('latest', () => {
    const [a, toggleNode, c] = $getRoot().getChildren();
    if (!$isToggleNode(toggleNode)) throw new Error('the toggle is missing');
    const header = toggleNode.getFirstChildOrThrow();
    const body = toggleNode.getLastChildOrThrow();
    if (!$isToggleBodyNode(body)) throw new Error('the body is missing');
    const [x, y] = body.getChildren();
    return [a, toggleNode, header, x, y, c].map((node) => node.getKey());
  });
  const [a, toggleElement, header, x, y, c] = keys.map((key) =>
    editor.getElementByKey(key),
  );
  stubRect(a, { top: 0, bottom: 20, left: ROOT_LEFT });
  stubRect(toggleElement, { top: 24, bottom: 100, left: ROOT_LEFT });
  stubRect(header, { top: 24, bottom: 44, left: 48 });
  stubRect(x, { top: 48, bottom: 68, left: 48 });
  stubRect(y, { top: 70, bottom: 90, left: 48 });
  stubRect(c, { top: 104, bottom: 124, left: ROOT_LEFT });
  return mounted;
};

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

const dragEvent = (
  type: 'dragover' | 'drop',
  clientY: number,
  clientX = ROOT_LEFT,
) =>
  new TestDragEvent(type, {
    clientX,
    clientY,
    bubbles: true,
    cancelable: true,
  });

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

const startDragOfBlockAt = (anchor: Element, clientY: number) => {
  fireEvent.mouseMove(anchor, { clientY });
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

// A paragraph "p" at 0 to 20, then a bullet list of "a" at 24 to 44 and "b" at 48 to 68, the list's items' text starting at 40.
const mountList = () => {
  const mounted = mountDocument(() => [
    paragraph('p'),
    list('bullet', [{ text: 'a' }, { text: 'b' }]),
  ]);
  const { editor } = mounted;
  const [p, listElement, a, b] = editor
    .read('latest', () => {
      const [pNode, listNode] = $getRoot().getChildren();
      if (!$isListNode(listNode)) throw new Error('the list is missing');
      return [pNode, listNode, ...listNode.getChildren()];
    })
    .map((node) => editor.getElementByKey(node.getKey()));
  stubRect(p, { top: 0, bottom: 20, left: ROOT_LEFT });
  stubRect(listElement, { top: 24, bottom: 68, left: ROOT_LEFT });
  stubRect(a, { top: 24, bottom: 44, left: 40 });
  stubRect(b, { top: 48, bottom: 68, left: 40 });
  return mounted;
};

// A bullet list of "a" with its sub-item "a1", then "b": "a" at 24 to 44, the wrapper that holds "a1" and "a1" itself at 48 to 68, and "b" at 72 to 92.
const mountParentItem = () => {
  const mounted = mountDocument(() => [
    list('bullet', [{ text: 'a', children: [{ text: 'a1' }] }, { text: 'b' }]),
  ]);
  const { editor } = mounted;
  const [a, wrapper, b, a1] = editor
    .read('latest', () => {
      const [listNode] = $getRoot().getChildren();
      if (!$isListNode(listNode)) throw new Error('the list is missing');
      const [aNode, wrapperNode, bNode] = listNode.getChildren();
      const subList = $isListItemNode(wrapperNode)
        ? wrapperNode.getFirstChild()
        : null;
      const subItem = $isListNode(subList) ? subList.getFirstChild() : null;
      if (subItem === null) throw new Error('the sub-item is missing');
      return [aNode, wrapperNode, bNode, subItem];
    })
    .map((node) => editor.getElementByKey(node.getKey()));
  stubRect(a, { top: 24, bottom: 44, left: 40 });
  stubRect(wrapper, { top: 48, bottom: 68, left: 40 });
  stubRect(a1, { top: 48, bottom: 68, left: 64 });
  stubRect(b, { top: 72, bottom: 92, left: 40 });
  return mounted;
};

const handleHeight = (handle: HTMLElement) =>
  handle.style.getPropertyValue('--block-drag-handle-height');

describe('BlockDragHandlePlugin', () => {
  it('gives the handle of an open toggle the height of its header and body together', () => {
    const { anchor } = mountNested();

    fireEvent.mouseMove(anchor, { clientY: 30 });

    expect(handleHeight(screen.getByLabelText('Drag to move block'))).toBe(
      '76px',
    );
  });

  it('gives the handle of a block inside a toggle body the height of that block alone', () => {
    const { anchor } = mountNested();

    fireEvent.mouseMove(anchor, { clientY: 55 });

    expect(handleHeight(screen.getByLabelText('Drag to move block'))).toBe(
      '20px',
    );
  });

  it('gives the handle of a list item with sub-items the height of the item and all its sub-items, and of an item without them its own', () => {
    const { anchor } = mountParentItem();

    fireEvent.mouseMove(anchor, { clientY: 30 });
    const parentHeight = handleHeight(
      screen.getByLabelText('Drag to move block'),
    );
    fireEvent.mouseMove(anchor, { clientY: 80 });

    expect(parentHeight).toBe('44px');
    expect(handleHeight(screen.getByLabelText('Drag to move block'))).toBe(
      '20px',
    );
  });

  it('keeps the parent’s row hovered while the pointer is on its handle beside the sub-items', () => {
    const { anchor } = mountParentItem();
    fireEvent.mouseMove(anchor, { clientY: 30 });
    const handle = screen.getByLabelText('Drag to move block');

    fireEvent.mouseMove(handle, { clientY: 58 });

    expect(handleHeight(screen.getByLabelText('Drag to move block'))).toBe(
      '44px',
    );
  });

  it('leaves the saved document unchanged after a cancelled drag, and a later drop moves nothing', async () => {
    const { editor, anchor, root } = mount(['a', 'b', 'c']);
    const handle = startDragOfBlockAt(anchor, rowTop(0) + 1);
    await dispatchOnRoot(
      root,
      dragEvent('dragover', rowTop(2) + ROW_HEIGHT + 10),
    );

    fireEvent.dragEnd(handle);
    await dispatchOnRoot(root, dragEvent('drop', rowTop(2) + ROW_HEIGHT + 10));

    expect(outlineOf(editor)).toEqual(['a', 'b', 'c']);
  });

  it('leaves the saved document unchanged for a drop on the block’s own position', async () => {
    const { editor, anchor, root } = mount(['a', 'b', 'c']);
    startDragOfBlockAt(anchor, rowTop(1) + 1);

    await dispatchOnRoot(root, dragEvent('drop', rowTop(1) + 1));

    expect(outlineOf(editor)).toEqual(['a', 'b', 'c']);
  });

  it('puts the dragged block where it is dropped, and one undo restores the order before the drag', async () => {
    const { editor, anchor, root } = mount(['a', 'b', 'c']);
    startDragOfBlockAt(anchor, rowTop(0) + 1);
    const belowLastBlock = rowTop(2) + ROW_HEIGHT + 10;
    await dispatchOnRoot(root, dragEvent('dragover', belowLastBlock));

    await dispatchOnRoot(root, dragEvent('drop', belowLastBlock));
    expect(outlineOf(editor)).toEqual(['b', 'c', 'a']);

    await undo(editor);
    expect(outlineOf(editor)).toEqual(['a', 'b', 'c']);
  });

  it('puts a block dropped on the lower half of an open toggle’s header at the start of its body', async () => {
    const { editor, anchor, root } = mountNested();
    startDragOfBlockAt(anchor, 110);

    await dispatchOnRoot(root, dragEvent('drop', 40, 20));

    expect(outlineOf(editor)).toEqual(['a', 'T{c,x,y}']);
  });

  it('puts a block dropped below the last block of a toggle body, with the pointer left of the body’s text, after the toggle', async () => {
    const { editor, anchor, root } = mountNested();
    startDragOfBlockAt(anchor, 80);

    await dispatchOnRoot(root, dragEvent('drop', 86, 20));

    expect(outlineOf(editor)).toEqual(['a', 'T{x}', 'y', 'c']);
  });

  it('puts a paragraph dropped on the lower half of a list item, with the pointer at or right of its text, as the first child of that item', async () => {
    const { editor, anchor, root } = mountList();
    startDragOfBlockAt(anchor, 10);

    await dispatchOnRoot(root, dragEvent('drop', 40, 100));

    expect(outlineOf(editor)).toEqual(['bullet(a[p],b)']);
  });

  it('turns a list item dropped outside every list, with the pointer left of the list, into a paragraph after the list', async () => {
    const { editor, anchor, root } = mountList();
    startDragOfBlockAt(anchor, 56);

    await dispatchOnRoot(root, dragEvent('drop', 66, 20));

    expect(outlineOf(editor)).toEqual(['p', 'bullet(a)', 'b']);
  });
});
