import { act } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import {
  $createLineBreakNode,
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  $getSelection,
  $setSelection,
  $isRangeSelection,
  $isElementNode,
  $isTextNode,
  COMMAND_PRIORITY_LOW,
  KEY_ENTER_COMMAND,
  type ElementNode,
  type LexicalEditor,
} from 'lexical';
import { $createHeadingNode } from '@lexical/rich-text';
import { $createToggleNode, $isToggleNode } from '../../../nodes/ToggleNode';
import { ToggleKeyboardPlugin } from '../ToggleKeyboardPlugin';
import {
  $bodyOf,
  $firstToggle,
  body,
  outlineOfRoot,
  paragraph,
} from '../../__tests__/support/toggleFixtures';
import { mountEditor, updateEditor } from '../../__tests__/support/mountEditor';

type ToggleSetup = {
  header: () => ElementNode;
  // Puts the caret; it runs after the document is built, inside the same update.
  placeCaret: (header: ElementNode) => void;
  collapsed?: boolean;
  bodyTexts?: string[];
};

// The document is the toggle followed by the paragraph 'After', so a block put after the toggle can be told from one put into it.
const setUp = (
  editor: LexicalEditor,
  { header, placeCaret, collapsed = false, bodyTexts = ['One'] }: ToggleSetup,
) => {
  updateEditor(editor, () => {
    const headerBlock = header();
    $getRoot()
      .clear()
      .append(
        $createToggleNode(collapsed).append(headerBlock, body(...bodyTexts)),
        paragraph('After'),
      );
    placeCaret(headerBlock);
  });
};

const paragraphOf = (...texts: string[]) =>
  $createParagraphNode().append(...texts.map((text) => $createTextNode(text)));

const boldRunAfter = (plain: string, bold: string) =>
  $createParagraphNode().append(
    $createTextNode(plain),
    $createTextNode(bold).toggleFormat('bold'),
  );

// A heading whose last child is a soft line break.
const headingEndingInBreak = () =>
  $createHeadingNode('h2').append(
    $createTextNode('Head'),
    $createLineBreakNode(),
  );

const caretInChild =
  (index: number, offset: number) => (header: ElementNode) => {
    const child = header.getChildAtIndex(index);
    if (!$isTextNode(child)) throw new Error('The child is not a text node');
    child.select(offset, offset);
  };

const caretOnBlock = (offset: number) => (header: ElementNode) => {
  header.select(offset, offset);
};

const pressEnter = (
  editor: LexicalEditor,
  options: { shiftKey?: boolean; withoutEvent?: boolean } = {},
) => {
  const event = options.withoutEvent
    ? null
    : new KeyboardEvent('keydown', {
        key: 'Enter',
        cancelable: true,
        shiftKey: options.shiftKey ?? false,
      });
  let handled = false;
  act(() => {
    handled = editor.dispatchCommand(KEY_ENTER_COMMAND, event);
  });
  return { handled, defaultPrevented: event?.defaultPrevented ?? false };
};

// What Enter leaves in the document, with the given plugins mounted.
const outcomeOf = (
  plugins: ReactNode,
  prepare: (editor: LexicalEditor) => void,
) => {
  const editor = mountEditor(plugins);
  prepare(editor);
  pressEnter(editor);
  return outlineOfRoot(editor);
};

const expectEnterLeftToTheEditor = (
  prepare: (editor: LexicalEditor) => void,
) => {
  expect(outcomeOf(<ToggleKeyboardPlugin />, prepare)).toEqual(
    outcomeOf(null, prepare),
  );
};

// The reads below use editor.read, which commits the update the command left pending, and not the committed state: the browser's own selection sync, which jsdom runs a moment later, can move the caret the handler placed.

// Where the caret is: the text of its top-level block and its offset in its own node.
const caret = (editor: LexicalEditor) =>
  editor.read(() => {
    const selection = $getSelection();
    if (!$isRangeSelection(selection)) return null;
    return {
      block: selection.anchor
        .getNode()
        .getTopLevelElementOrThrow()
        .getTextContent(),
      offset: selection.anchor.offset,
    };
  });

const rootBlockTypes = (editor: LexicalEditor) =>
  editor.read(() =>
    $getRoot()
      .getChildren()
      .map((block) => block.getType()),
  );

const headerTypeOfToggleAt = (editor: LexicalEditor, index: number) =>
  editor.read(() => {
    const toggle = $getRoot().getChildAtIndex(index);
    if (!$isToggleNode(toggle)) throw new Error('The block is not a toggle');
    return toggle.getFirstChildOrThrow().getType();
  });

const mounted = () => mountEditor(<ToggleKeyboardPlugin />);

describe('ToggleKeyboardPlugin Enter', () => {
  it('leaves Enter to a menu listener that takes it, and takes it itself once that listener passes', () => {
    const editor = mounted();
    setUp(editor, {
      header: () => paragraphOf('Hello world'),
      placeCaret: caretInChild(0, 5),
    });
    let menuTakesEnter = true;
    editor.registerCommand(
      KEY_ENTER_COMMAND,
      () => menuTakesEnter,
      COMMAND_PRIORITY_LOW,
    );

    const whileMenuOpen = pressEnter(editor);

    expect(whileMenuOpen).toEqual({ handled: true, defaultPrevented: false });
    expect(outlineOfRoot(editor)).toEqual([
      'toggle[Hello world, body[One]]',
      'After',
    ]);

    menuTakesEnter = false;
    pressEnter(editor);

    expect(outlineOfRoot(editor)).toEqual([
      'toggle[Hello, body[ world, One]]',
      'After',
    ]);
  });

  it('splits an open toggle header in the middle: the text before the caret stays, the rest starts the body, the caret is at its start', () => {
    const editor = mounted();
    setUp(editor, {
      header: () => paragraphOf('Hello world'),
      placeCaret: caretInChild(0, 5),
    });

    const result = pressEnter(editor);

    expect(result.defaultPrevented).toBe(true);
    expect(outlineOfRoot(editor)).toEqual([
      'toggle[Hello, body[ world, One]]',
      'After',
    ]);
    expect(caret(editor)).toEqual({ block: ' world', offset: 0 });
  });

  it('splits a collapsed toggle header in the middle: the rest goes directly after the toggle and the toggle stays collapsed', () => {
    const editor = mounted();
    setUp(editor, {
      header: () => paragraphOf('Hello world'),
      placeCaret: caretInChild(0, 5),
      collapsed: true,
    });

    pressEnter(editor);

    expect(outlineOfRoot(editor)).toEqual([
      'toggle[Hello, body[One]]',
      ' world',
      'After',
    ]);
    expect(caret(editor)).toEqual({ block: ' world', offset: 0 });
    expect(editor.read(() => $firstToggle().isCollapsed())).toBe(true);
  });

  it('splits a heading header in the middle into two headings, the rest starting the body', () => {
    const editor = mounted();
    setUp(editor, {
      header: () =>
        $createHeadingNode('h2').append($createTextNode('Hello world')),
      placeCaret: caretInChild(0, 5),
    });

    pressEnter(editor);

    expect(
      editor.read(() => {
        const toggle = $firstToggle();
        return [
          toggle.getFirstChildOrThrow().getType(),
          $bodyOf(toggle).getFirstChildOrThrow().getType(),
        ];
      }),
    ).toEqual(['heading', 'heading']);
    expect(outlineOfRoot(editor)).toEqual([
      'toggle[Hello, body[ world, One]]',
      'After',
    ]);
  });

  it.each([
    ['plain text', () => paragraphOf('Hello'), caretInChild(0, 5)],
    ['bold text', () => boldRunAfter('Hello ', 'world'), caretInChild(1, 5)],
    ['a soft line break, in a heading', headingEndingInBreak, caretOnBlock(2)],
  ])(
    'adds one empty paragraph directly after a collapsed toggle when Enter is pressed at the end of a header ending in %s',
    (_name, header, placeCaret) => {
      const editor = mounted();
      setUp(editor, { header, placeCaret, collapsed: true });

      const result = pressEnter(editor);

      expect(result.defaultPrevented).toBe(true);
      expect(rootBlockTypes(editor)).toEqual([
        'toggle',
        'paragraph',
        'paragraph',
      ]);
      expect(outlineOfRoot(editor)[1]).toBe('');
      expect(caret(editor)).toEqual({ block: '', offset: 0 });
      expect(editor.read(() => $firstToggle().isCollapsed())).toBe(true);
    },
  );

  it.each([
    ['plain text', () => paragraphOf('Hello'), caretInChild(0, 5)],
    ['bold text', () => boldRunAfter('Hello ', 'world'), caretInChild(1, 5)],
    ['a soft line break, in a heading', headingEndingInBreak, caretOnBlock(2)],
  ])(
    'puts the caret at the start of the first body block and adds no block when Enter is pressed at the end of an open toggle header ending in %s',
    (_name, header, placeCaret) => {
      const editor = mounted();
      setUp(editor, { header, placeCaret });
      const blocksBefore = outlineOfRoot(editor).length;

      pressEnter(editor);

      expect(outlineOfRoot(editor)).toHaveLength(blocksBefore);
      expect(editor.read(() => $bodyOf($firstToggle()).getChildrenSize())).toBe(
        1,
      );
      expect(caret(editor)).toEqual({ block: 'One', offset: 0 });
    },
  );

  it('creates a paragraph for the caret in an open toggle whose body has no block', () => {
    const editor = mounted();
    updateEditor(editor, () => {
      const header = paragraphOf('Hello');
      $getRoot().clear().append($createToggleNode().append(header, body()));
      caretInChild(0, 5)(header);
    });

    pressEnter(editor);

    expect(outlineOfRoot(editor)).toEqual(['toggle[Hello, body[]]']);
    expect(caret(editor)).toEqual({ block: '', offset: 0 });
  });

  it.each([
    ['a paragraph', () => paragraphOf('Header'), 'paragraph'],
    [
      'a heading',
      () => $createHeadingNode('h2').append($createTextNode('Header')),
      'heading',
    ],
  ])(
    'adds an empty paragraph directly above the toggle when Enter is pressed at the start of header text in %s, keeping the header and its caret',
    (_name, header, headerType) => {
      const editor = mounted();
      setUp(editor, { header, placeCaret: caretInChild(0, 0) });

      pressEnter(editor);

      expect(outlineOfRoot(editor)).toEqual([
        '',
        'toggle[Header, body[One]]',
        'After',
      ]);
      expect(rootBlockTypes(editor)).toEqual([
        'paragraph',
        'toggle',
        'paragraph',
      ]);
      expect(headerTypeOfToggleAt(editor, 1)).toBe(headerType);
      expect(caret(editor)).toEqual({ block: 'Header', offset: 0 });
    },
  );

  it('treats Enter in an empty header as the end of the header, not as its start', () => {
    const editor = mounted();
    setUp(editor, {
      header: () => $createParagraphNode(),
      placeCaret: caretOnBlock(0),
    });

    pressEnter(editor);

    expect(outlineOfRoot(editor)).toEqual(['toggle[, body[One]]', 'After']);
    expect(caret(editor)).toEqual({ block: 'One', offset: 0 });
  });

  it.each([
    ['in the middle', 5, 'toggle[Hello\n world, body[One]]'],
    ['at the end', 11, 'toggle[Hello world\n, body[One]]'],
    ['at the start', 0, 'toggle[\nHello world, body[One]]'],
  ])(
    'inserts a soft line break in the header and leaves the structure alone when Shift+Enter is pressed %s',
    (_name, offset, expectedToggle) => {
      const editor = mounted();
      setUp(editor, {
        header: () => paragraphOf('Hello world'),
        placeCaret: caretInChild(0, offset),
      });

      pressEnter(editor, { shiftKey: true });

      expect(outlineOfRoot(editor)).toEqual([expectedToggle, 'After']);
    },
  );

  it('removes text selected inside one header and then splits at the caret', () => {
    const editor = mounted();
    setUp(editor, {
      header: () => paragraphOf('Hello world'),
      placeCaret: (header) => {
        const text = header.getFirstChildOrThrow();
        if (!$isTextNode(text)) throw new Error('The child is not a text node');
        text.select(3, 7);
      },
    });

    pressEnter(editor);

    expect(outlineOfRoot(editor)).toEqual([
      'toggle[Hel, body[orld, One]]',
      'After',
    ]);
    expect(caret(editor)).toEqual({ block: 'orld', offset: 0 });
  });

  it('leaves an Enter over a selection that reaches out of the header to the editor', () => {
    expectEnterLeftToTheEditor((editor) => {
      setUp(editor, {
        header: () => paragraphOf('Hello world'),
        placeCaret: (header) => {
          const headerText = header.getFirstChildOrThrow();
          const bodyBlock = $bodyOf($firstToggle()).getFirstChildOrThrow();
          const bodyText = $isElementNode(bodyBlock)
            ? bodyBlock.getFirstChildOrThrow()
            : null;
          if (!$isTextNode(headerText) || !$isTextNode(bodyText)) {
            throw new Error('The children are not text nodes');
          }
          headerText.select(5, 5).focus.set(bodyText.getKey(), 1, 'text');
        },
      });
    });
  });

  it('does nothing when the editor has no selection', () => {
    const editor = mounted();
    setUp(editor, {
      header: () => paragraphOf('Hello world'),
      placeCaret: caretInChild(0, 5),
    });
    updateEditor(editor, () => {
      $setSelection(null);
    });

    const result = pressEnter(editor);

    expect(result.handled).toBe(false);
    expect(outlineOfRoot(editor)).toEqual([
      'toggle[Hello world, body[One]]',
      'After',
    ]);
  });

  it.each([
    [
      'the middle of a header',
      {
        header: () => paragraphOf('Hello world'),
        placeCaret: caretInChild(0, 5),
      },
      ['toggle[Hello, body[ world, One]]', 'After'],
    ],
    [
      'the start of a header',
      { header: () => paragraphOf('Header'), placeCaret: caretInChild(0, 0) },
      ['', 'toggle[Header, body[One]]', 'After'],
    ],
    [
      'the end of a collapsed toggle header',
      {
        header: () => paragraphOf('Hello'),
        placeCaret: caretInChild(0, 5),
        collapsed: true,
      },
      ['toggle[Hello, body[One]]', '', 'After'],
    ],
    [
      'the end of an open toggle header',
      { header: () => paragraphOf('Hello'), placeCaret: caretInChild(0, 5) },
      ['toggle[Hello, body[One]]', 'After'],
    ],
    [
      'an empty last body paragraph',
      {
        header: () => paragraphOf('Hello'),
        bodyTexts: ['One', ''],
        placeCaret: () => {
          $bodyOf($firstToggle()).getLastChildOrThrow().selectStart();
        },
      },
      ['toggle[Hello, body[One]]', '', 'After'],
    ],
  ])(
    'handles an Enter that carries no keyboard event in %s',
    (_name, setup, expectedOutline) => {
      const editor = mounted();
      setUp(editor, setup);

      pressEnter(editor, { withoutEvent: true });

      expect(outlineOfRoot(editor)).toEqual(expectedOutline);
    },
  );

  it('removes all the selected header text and then takes the Enter as one at the end of an empty header', () => {
    const editor = mounted();
    setUp(editor, {
      header: () => paragraphOf('Hello world'),
      placeCaret: (header) => {
        const text = header.getFirstChildOrThrow();
        if (!$isTextNode(text)) throw new Error('The child is not a text node');
        text.select(0, 11);
      },
    });

    pressEnter(editor);

    expect(outlineOfRoot(editor)).toEqual(['toggle[, body[One]]', 'After']);
    expect(caret(editor)).toEqual({ block: 'One', offset: 0 });
  });

  it('removes the selected text up to the end of the header and then takes the Enter as one at the end', () => {
    const editor = mounted();
    setUp(editor, {
      header: () => paragraphOf('Hello world'),
      placeCaret: (header) => {
        const text = header.getFirstChildOrThrow();
        if (!$isTextNode(text)) throw new Error('The child is not a text node');
        text.select(3, 11);
      },
    });

    pressEnter(editor);

    expect(outlineOfRoot(editor)).toEqual(['toggle[Hel, body[One]]', 'After']);
    expect(caret(editor)).toEqual({ block: 'One', offset: 0 });
  });

  it('leaves an Enter over a selection that starts in the empty last body paragraph and reaches out of it to the editor', () => {
    expectEnterLeftToTheEditor((editor) => {
      setUp(editor, {
        header: () => paragraphOf('Hello'),
        bodyTexts: ['One', ''],
        placeCaret: () => {
          const afterBlock = $getRoot().getLastChildOrThrow();
          const afterText = $isElementNode(afterBlock)
            ? afterBlock.getFirstChildOrThrow()
            : null;
          if (!$isTextNode(afterText)) throw new Error('Not a text node');
          const lastBodyBlock = $bodyOf($firstToggle()).getLastChildOrThrow();
          if (!$isElementNode(lastBodyBlock)) throw new Error('Not a block');
          lastBodyBlock.select(0, 0).focus.set(afterText.getKey(), 2, 'text');
        },
      });
    });
  });

  it('leaves an Enter in a body paragraph that has text to the editor', () => {
    expectEnterLeftToTheEditor((editor) => {
      setUp(editor, {
        header: () => paragraphOf('Hello'),
        bodyTexts: ['One', 'Two'],
        placeCaret: () => {
          $bodyOf($firstToggle()).getLastChildOrThrow().selectEnd();
        },
      });
    });
  });

  it('leaves an Enter in an empty body paragraph that is not the last one to the editor', () => {
    expectEnterLeftToTheEditor((editor) => {
      setUp(editor, {
        header: () => paragraphOf('Hello'),
        bodyTexts: ['', 'Two'],
        placeCaret: () => {
          $bodyOf($firstToggle()).getFirstChildOrThrow().selectStart();
        },
      });
    });
  });

  it('leaves an Enter in the empty last paragraph of a body that is outside a toggle to the editor', () => {
    expectEnterLeftToTheEditor((editor) => {
      updateEditor(editor, () => {
        const stray = body('One', '');
        $getRoot().clear().append(stray, paragraph('After'));
        stray.getLastChildOrThrow().selectStart();
      });
    });
  });

  it('moves an empty last body paragraph out after the toggle', () => {
    const editor = mounted();
    setUp(editor, {
      header: () => paragraphOf('Hello'),
      bodyTexts: ['One', ''],
      placeCaret: () => {
        $bodyOf($firstToggle()).getLastChildOrThrow().selectStart();
      },
    });

    pressEnter(editor);

    expect(outlineOfRoot(editor)).toEqual([
      'toggle[Hello, body[One]]',
      '',
      'After',
    ]);
    expect(caret(editor)).toEqual({ block: '', offset: 0 });
  });
});
