import { act } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  $isTextNode,
  PASTE_COMMAND,
  PASTE_TAG,
  SELECTION_INSERT_CLIPBOARD_NODES_COMMAND,
  $createNodeSelection,
  $setSelection,
  $getSelection,
  type BaseSelection,
  type ElementNode,
  type LexicalEditor,
  type LexicalNode,
} from 'lexical';
import { $createLinkNode } from '@lexical/link';
import { $createToggleNode, $isToggleNode } from '../../../nodes/ToggleNode';
import { TogglePastePlugin } from '../TogglePastePlugin';
import {
  TEST_NAMESPACE,
  body,
  makeEditor,
  outlineOfRoot,
  paragraph,
  setRootChildren,
} from '../../__tests__/support/toggleFixtures';
import { mountEditor, updateEditor } from '../../__tests__/support/mountEditor';

// jsdom has no DragEvent and no ClipboardEvent, which Lexical's paste handler checks for, so the globals are plain events and a paste event is an instance of the second.
class TestClipboardEvent extends Event {}

// A paste event that carries the clipboard formats given, as the browser's clipboard does.
const pasteEvent = (formats: Record<string, string>) => {
  const event = new TestClipboardEvent('paste', { cancelable: true });
  Object.defineProperty(event, 'clipboardData', {
    value: {
      types: Object.keys(formats),
      files: [],
      getData: (type: string) => formats[type] ?? '',
    },
  });
  return event;
};

// What the editor puts on the clipboard for the given blocks: its lexical format, which carries the namespace of the editor that copied it.
const lexicalFormat = (blocks: () => LexicalNode[]) => {
  const source = makeEditor();
  setRootChildren(source, blocks);
  return JSON.stringify({
    namespace: TEST_NAMESPACE,
    nodes: source.getEditorState().toJSON().root.children,
  });
};

const richClipboard = (blocks: () => LexicalNode[]) => ({
  'application/x-lexical-editor': lexicalFormat(blocks),
});

const textSelection = (block: ElementNode, from: number, to: number = from) => {
  const text = block.getFirstChildOrThrow();
  if (!$isTextNode(text)) throw new Error('The child is not a text node');
  text.select(from, to);
};

// The document is the toggle holding the header 'Hello world' and the body 'One', then the paragraph 'After'.
const setUp = (
  editor: LexicalEditor,
  options: {
    collapsed?: boolean;
    place: (header: ElementNode, after: ElementNode) => void;
  },
) => {
  updateEditor(editor, () => {
    const header = $createParagraphNode().append(
      $createTextNode('Hello world'),
    );
    const after = paragraph('After');
    $getRoot()
      .clear()
      .append(
        $createToggleNode(options.collapsed ?? false).append(
          header,
          body('One'),
        ),
        after,
      );
    options.place(header, after);
  });
};

const paste = (editor: LexicalEditor, formats: Record<string, string>) => {
  const event = pasteEvent(formats);
  act(() => {
    editor.dispatchCommand(PASTE_COMMAND, event as ClipboardEvent);
  });
  return event;
};

const outcomeOf = (
  plugins: ReactNode,
  formats: Record<string, string>,
  place: (header: ElementNode, after: ElementNode) => void,
) => {
  const editor = mountEditor(plugins);
  setUp(editor, { place });
  paste(editor, formats);
  return outlineOfRoot(editor);
};

const expectLeftToTheEditor = (
  formats: Record<string, string>,
  place: (header: ElementNode, after: ElementNode) => void,
) => {
  expect(outcomeOf(<TogglePastePlugin />, formats, place)).toEqual(
    outcomeOf(null, formats, place),
  );
};

const twoParagraphs = () => [paragraph('A'), paragraph('B')];

beforeEach(() => {
  vi.stubGlobal('DragEvent', class extends Event {});
  vi.stubGlobal('ClipboardEvent', TestClipboardEvent);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('TogglePastePlugin', () => {
  it('pastes several blocks into the middle of an open toggle header without adding a block next to the header', () => {
    const editor = mountEditor(<TogglePastePlugin />);
    setUp(editor, {
      place: (header) => {
        textSelection(header, 5);
      },
    });

    paste(editor, richClipboard(twoParagraphs));

    expect(outlineOfRoot(editor)).toEqual([
      'toggle[HelloA, body[B world, One]]',
      'After',
    ]);
  });

  it('pastes several blocks into the middle of a collapsed toggle header directly after the toggle', () => {
    const editor = mountEditor(<TogglePastePlugin />);
    setUp(editor, {
      collapsed: true,
      place: (header) => {
        textSelection(header, 5);
      },
    });

    paste(editor, richClipboard(twoParagraphs));

    expect(outlineOfRoot(editor)).toEqual([
      'toggle[HelloA, body[One]]',
      'B world',
      'After',
    ]);
  });

  it('removes text selected in the header before it pastes blocks', () => {
    const editor = mountEditor(<TogglePastePlugin />);
    setUp(editor, {
      place: (header) => {
        textSelection(header, 3, 7);
      },
    });

    paste(editor, richClipboard(twoParagraphs));

    expect(outlineOfRoot(editor)).toEqual([
      'toggle[HelA, body[Borld, One]]',
      'After',
    ]);
  });

  it('pastes a plain-text clipboard with line breaks into a header as it would the same blocks, in an undo entry of its own', () => {
    const editor = mountEditor(<TogglePastePlugin />);
    setUp(editor, {
      place: (header) => {
        textSelection(header, 5);
      },
    });
    const tags: string[] = [];
    editor.registerUpdateListener((update) => {
      tags.push(...update.tags);
    });

    const event = paste(editor, { 'text/plain': 'A\nB' });

    expect(outlineOfRoot(editor)).toEqual([
      'toggle[HelloA, body[B world, One]]',
      'After',
    ]);
    expect(event.defaultPrevented).toBe(true);
    expect(tags).toContain(PASTE_TAG);
  });

  it('leaves a plain-text clipboard of one line in a header to the editor', () => {
    expectLeftToTheEditor({ 'text/plain': 'one line' }, (header) => {
      textSelection(header, 5);
    });
  });

  it('leaves a paste with a caret outside any header to the editor, a rich one and a plain-text one', () => {
    const outside = (_header: ElementNode, after: ElementNode) => {
      textSelection(after, 2);
    };

    expectLeftToTheEditor(richClipboard(twoParagraphs), outside);
    expectLeftToTheEditor({ 'text/plain': 'A\nB' }, outside);
  });

  it('leaves a paste over a selection that reaches out of the header to the editor', () => {
    const reachesOut = (header: ElementNode, after: ElementNode) => {
      const headerText = header.getFirstChildOrThrow();
      const afterText = after.getFirstChildOrThrow();
      if (!$isTextNode(headerText) || !$isTextNode(afterText)) {
        throw new Error('The children are not text nodes');
      }
      headerText.select(5, 5).focus.set(afterText.getKey(), 2, 'text');
    };

    expectLeftToTheEditor(richClipboard(twoParagraphs), reachesOut);
    expectLeftToTheEditor({ 'text/plain': 'A\nB' }, reachesOut);
  });

  it.each([
    ['open', false],
    ['collapsed', true],
  ])(
    'pastes blocks copied above a %s toggle, and the toggle, into a plain paragraph with the blocks above the toggle and the toggle whole',
    (_name, collapsed) => {
      const editor = mountEditor(<TogglePastePlugin />);
      updateEditor(editor, () => {
        const target = $createParagraphNode();
        $getRoot().clear().append(target);
        target.select(0, 0);
      });

      paste(
        editor,
        richClipboard(() => [
          paragraph('Above'),
          $createToggleNode(collapsed).append(
            paragraph('Header'),
            body('One', 'Two'),
          ),
        ]),
      );

      expect(outlineOfRoot(editor)).toEqual([
        'Above',
        'toggle[Header, body[One, Two]]',
      ]);
      expect(
        editor.read(() => {
          const toggle = $getRoot().getChildAtIndex(1);
          if (!$isToggleNode(toggle)) throw new Error('Not the toggle');
          return toggle.isCollapsed();
        }),
      ).toBe(collapsed);
    },
  );

  it('leaves a paste that carries the lexical format to that format, even when its plain text has line breaks', () => {
    const editor = mountEditor(<TogglePastePlugin />);
    setUp(editor, {
      place: (header) => {
        textSelection(header, 5);
      },
    });

    paste(editor, {
      ...richClipboard(twoParagraphs),
      'text/plain': 'X\nY',
    });

    expect(outlineOfRoot(editor)).toEqual([
      'toggle[HelloA, body[B world, One]]',
      'After',
    ]);
  });

  it('leaves a paste that carries HTML to the HTML import, even when its plain text has line breaks', () => {
    const editor = mountEditor(<TogglePastePlugin />);
    setUp(editor, {
      place: (header) => {
        textSelection(header, 5);
      },
    });

    paste(editor, {
      'text/html': '<p>A</p><p>B</p>',
      'text/plain': 'X\nY',
    });

    expect(outlineOfRoot(editor)).toEqual([
      'toggle[HelloA, body[B world, One]]',
      'After',
    ]);
  });

  it('splits the header like Enter for a plain-text clipboard that is only a line break', () => {
    const editor = mountEditor(<TogglePastePlugin />);
    setUp(editor, {
      place: (header) => {
        textSelection(header, 5);
      },
    });

    paste(editor, { 'text/plain': '\n' });

    expect(outlineOfRoot(editor)).toEqual([
      'toggle[Hello, body[ world, One]]',
      'After',
    ]);
  });

  it('leaves a paste event that carries no clipboard data, and one whose clipboard data is null, to the editor', () => {
    const editor = mountEditor(<TogglePastePlugin />);
    setUp(editor, {
      place: (header) => {
        textSelection(header, 5);
      },
    });
    const withoutData = new Event('paste', { cancelable: true });
    const withNullData = new TestClipboardEvent('paste', { cancelable: true });
    Object.defineProperty(withNullData, 'clipboardData', { value: null });

    act(() => {
      editor.dispatchCommand(PASTE_COMMAND, withoutData as ClipboardEvent);
      editor.dispatchCommand(PASTE_COMMAND, withNullData as ClipboardEvent);
    });

    expect(withoutData.defaultPrevented).toBe(true);
    expect(withNullData.defaultPrevented).toBe(true);
    expect(outlineOfRoot(editor)).toEqual([
      'toggle[Hello world, body[One]]',
      'After',
    ]);
  });

  it('does nothing for a plain-text paste when the editor has no selection', () => {
    const editor = mountEditor(<TogglePastePlugin />);
    setUp(editor, {
      place: (header) => {
        textSelection(header, 5);
      },
    });
    updateEditor(editor, () => {
      $setSelection(null);
    });

    const event = paste(editor, { 'text/plain': 'A\nB' });

    expect(event.defaultPrevented).toBe(false);
    expect(outlineOfRoot(editor)).toEqual([
      'toggle[Hello world, body[One]]',
      'After',
    ]);
  });
});

describe('TogglePastePlugin clipboard nodes', () => {
  beforeEach(() => {
    vi.stubGlobal('DragEvent', class extends Event {});
    vi.stubGlobal('ClipboardEvent', TestClipboardEvent);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const $getSelectionOrThrow = () => {
    const selection = $getSelection();
    if (selection === null) throw new Error('The editor has no selection');
    return selection;
  };

  // Dispatches the command the editor's importers dispatch, inside an update, and returns whether a listener took it.
  const insertNodes = (
    editor: LexicalEditor,
    nodes: () => LexicalNode[],
    selection: () => BaseSelection = $getSelectionOrThrow,
  ) => {
    let handled = false;
    updateEditor(editor, () => {
      handled = editor.dispatchCommand(
        SELECTION_INSERT_CLIPBOARD_NODES_COMMAND,
        { nodes: nodes(), selection: selection() },
      );
    });
    return handled;
  };

  const unchanged = ['toggle[Hello world, body[One]]', 'After'];

  it('takes blocks that are all block elements', () => {
    const editor = mountEditor(<TogglePastePlugin />);
    setUp(editor, {
      place: (header) => {
        textSelection(header, 5);
      },
    });

    expect(insertNodes(editor, twoParagraphs)).toBe(true);
  });

  it('leaves a selection that is not a range selection to the editor', () => {
    const editor = mountEditor(<TogglePastePlugin />);
    setUp(editor, {
      place: (header) => {
        textSelection(header, 5);
      },
    });

    expect(insertNodes(editor, twoParagraphs, $createNodeSelection)).toBe(
      false,
    );
    expect(outlineOfRoot(editor)).toEqual(unchanged);
  });

  it('leaves nodes that include an inline node to the editor', () => {
    const editor = mountEditor(<TogglePastePlugin />);
    setUp(editor, {
      place: (header) => {
        textSelection(header, 5);
      },
    });

    expect(
      insertNodes(editor, () => [...twoParagraphs(), $createTextNode('x')]),
    ).toBe(false);
    expect(outlineOfRoot(editor)).toEqual(unchanged);
  });

  it('leaves a text node alone to the editor', () => {
    const editor = mountEditor(<TogglePastePlugin />);
    setUp(editor, {
      place: (header) => {
        textSelection(header, 5);
      },
    });

    expect(insertNodes(editor, () => [$createTextNode('x')])).toBe(false);
    expect(outlineOfRoot(editor)).toEqual(unchanged);
  });

  it('leaves an inline element alone to the editor', () => {
    const editor = mountEditor(<TogglePastePlugin />);
    setUp(editor, {
      place: (header) => {
        textSelection(header, 5);
      },
    });

    expect(
      insertNodes(editor, () => [
        $createLinkNode('https://example.com').append($createTextNode('x')),
      ]),
    ).toBe(false);
    expect(outlineOfRoot(editor)).toEqual(unchanged);
  });
});
