import { describe, expect, it } from 'vitest';
import {
  $createLineBreakNode,
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  $getSelection,
  $isRangeSelection,
  $isTextNode,
  type ElementNode,
  type LexicalEditor,
  type RangeSelection,
} from 'lexical';
import { $createHeadingNode } from '@lexical/rich-text';
import { $createListItemNode, $createListNode } from '@lexical/list';
import { $createToggleNode } from '../../../../nodes/ToggleNode';
import { insertBlocksBehindHeader } from '../insertBlocksBehindHeader';
import {
  $bodyOf,
  $firstToggle,
  body,
  inEditor,
  makeEditor,
  outlineOfRoot,
  paragraph,
} from '../../../__tests__/support/toggleFixtures';

type Setup = {
  header?: () => ElementNode;
  collapsed?: boolean;
  // Puts the selection; it receives the header and the paragraph after the toggle.
  place: (header: ElementNode, after: ElementNode) => RangeSelection;
  blocks: () => ElementNode[];
};

const textSelection = (
  block: ElementNode,
  from: number,
  to: number = from,
): RangeSelection => {
  const text = block.getFirstChildOrThrow();
  if (!$isTextNode(text)) throw new Error('The child is not a text node');
  return text.select(from, to);
};

// The document is the toggle holding the header 'Hello world' (unless given) and the body 'One', then the paragraph 'After'. Returns what the helper returned.
const paste = (editor: LexicalEditor, setup: Setup) =>
  inEditor(editor, () => {
    const header =
      setup.header?.() ??
      $createParagraphNode().append($createTextNode('Hello world'));
    const after = paragraph('After');
    $getRoot()
      .clear()
      .append(
        $createToggleNode(setup.collapsed ?? false).append(header, body('One')),
        after,
      );
    return insertBlocksBehindHeader(setup.place(header, after), setup.blocks());
  });

const bodyTypes = (editor: LexicalEditor) =>
  editor.read(() =>
    $bodyOf($firstToggle())
      .getChildren()
      .map((block) => block.getType()),
  );

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

const bulletList = () =>
  $createListNode('bullet').append(
    $createListItemNode().append($createTextNode('x')),
  );

describe('insertBlocksBehindHeader', () => {
  it('gives the first paragraph to the header, puts the others at the start of an open body in order, and ends the text after the caret on the last one, with the caret before it', () => {
    const editor = makeEditor();

    const handled = paste(editor, {
      place: (header) => textSelection(header, 5),
      blocks: () => [paragraph('A'), paragraph('B'), paragraph('C')],
    });

    expect(handled).toBe(true);
    expect(outlineOfRoot(editor)).toEqual([
      'toggle[HelloA, body[B, C world, One]]',
      'After',
    ]);
    expect(caret(editor)).toEqual({ block: 'C world', offset: 1 });
  });

  it('puts the caret on the block after its last child, before the moved text, when the last pasted block does not end in text', () => {
    const editor = makeEditor();

    paste(editor, {
      place: (header) => textSelection(header, 5),
      blocks: () => [
        paragraph('A'),
        $createParagraphNode().append(
          $createTextNode('B'),
          $createLineBreakNode(),
        ),
      ],
    });

    expect(caret(editor)).toEqual({ block: 'B\n world', offset: 2 });
  });

  it('puts the other blocks directly after a collapsed toggle, not into its body', () => {
    const editor = makeEditor();

    paste(editor, {
      collapsed: true,
      place: (header) => textSelection(header, 5),
      blocks: () => [paragraph('A'), paragraph('B'), paragraph('C')],
    });

    expect(outlineOfRoot(editor)).toEqual([
      'toggle[HelloA, body[One]]',
      'B',
      'C world',
      'After',
    ]);
  });

  it('leaves only the text before the caret in the header when the first block is a list, which goes to the destination, the text after the caret becoming a paragraph after it', () => {
    const editor = makeEditor();

    const handled = paste(editor, {
      place: (header) => textSelection(header, 5),
      blocks: () => [bulletList()],
    });

    expect(handled).toBe(true);
    expect(caret(editor)).toEqual({ block: 'x', offset: 1 });
    expect(outlineOfRoot(editor)).toEqual([
      'toggle[Hello, body[x,  world, One]]',
      'After',
    ]);
    expect(bodyTypes(editor)).toEqual(['list', 'paragraph', 'paragraph']);
  });

  it('puts the text after the caret into a paragraph of its own after a last block that is a toggle, a paragraph even when the header was a heading', () => {
    const editor = makeEditor();

    const handled = paste(editor, {
      header: () =>
        $createHeadingNode('h2').append($createTextNode('Hello world')),
      place: (header) => textSelection(header, 5),
      blocks: () => [
        paragraph('A'),
        $createToggleNode().append(paragraph('Inner'), body('Deep')),
      ],
    });

    expect(handled).toBe(true);
    expect(caret(editor)).toEqual({ block: 'Deep', offset: 4 });
    expect(outlineOfRoot(editor)).toEqual([
      'toggle[HelloA, body[toggle[Inner, body[Deep]],  world, One]]',
      'After',
    ]);
    expect(bodyTypes(editor)).toEqual(['toggle', 'paragraph', 'paragraph']);
  });

  it('puts the text after the caret at the end of a last block that is a heading, which stays a heading', () => {
    const editor = makeEditor();

    paste(editor, {
      place: (header) => textSelection(header, 5),
      blocks: () => [
        paragraph('A'),
        $createHeadingNode('h2').append($createTextNode('Title')),
      ],
    });

    expect(outlineOfRoot(editor)).toEqual([
      'toggle[HelloA, body[Title world, One]]',
      'After',
    ]);
    expect(bodyTypes(editor)).toEqual(['heading', 'paragraph']);
  });

  it('leaves no empty block behind the pasted ones when the caret is at the end of the header', () => {
    const editor = makeEditor();

    paste(editor, {
      place: (header) => textSelection(header, 11),
      blocks: () => [paragraph('A'), paragraph('B')],
    });

    expect(caret(editor)).toEqual({ block: 'B', offset: 1 });
    expect(outlineOfRoot(editor)).toEqual([
      'toggle[Hello worldA, body[B, One]]',
      'After',
    ]);
    expect(bodyTypes(editor)).toEqual(['paragraph', 'paragraph']);
  });

  it('leaves no empty paragraph behind a pasted list when the caret is at the end of the header, the caret at the end of the list', () => {
    const editor = makeEditor();

    const handled = paste(editor, {
      place: (header) => textSelection(header, 11),
      blocks: () => [paragraph('A'), bulletList()],
    });

    expect(handled).toBe(true);
    expect(bodyTypes(editor)).toEqual(['list', 'paragraph']);
    expect(caret(editor)).toEqual({ block: 'x', offset: 1 });
  });

  it('gives the pasted first block to the header and moves the header text to the end of the last block when the caret is at the start of the header text', () => {
    const editor = makeEditor();

    paste(editor, {
      place: (header) => textSelection(header, 0),
      blocks: () => [paragraph('A'), paragraph('B')],
    });

    expect(outlineOfRoot(editor)).toEqual([
      'toggle[A, body[BHello world, One]]',
      'After',
    ]);
  });

  it('keeps a heading header a heading when the caret is at the start of its text', () => {
    const editor = makeEditor();

    paste(editor, {
      header: () =>
        $createHeadingNode('h2').append($createTextNode('Hello world')),
      place: (header) => textSelection(header, 0),
      blocks: () => [paragraph('A'), paragraph('B')],
    });

    expect(
      editor.read(() => $firstToggle().getFirstChildOrThrow().getType()),
    ).toBe('heading');
  });

  it('removes selected text of the header before it pastes', () => {
    const editor = makeEditor();

    paste(editor, {
      place: (header) => textSelection(header, 3, 7),
      blocks: () => [paragraph('A'), paragraph('B')],
    });

    expect(outlineOfRoot(editor)).toEqual([
      'toggle[HelA, body[Borld, One]]',
      'After',
    ]);
  });

  it('returns false and changes nothing for a single paragraph, which the editor inserts into the header', () => {
    const editor = makeEditor();

    const handled = paste(editor, {
      place: (header) => textSelection(header, 5),
      blocks: () => [paragraph('A')],
    });

    expect(handled).toBe(false);
    expect(outlineOfRoot(editor)).toEqual([
      'toggle[Hello world, body[One]]',
      'After',
    ]);
  });

  it('returns false for no blocks', () => {
    const editor = makeEditor();

    const handled = paste(editor, {
      place: (header) => textSelection(header, 5),
      blocks: () => [],
    });

    expect(handled).toBe(false);
  });

  it('returns false and changes nothing for a caret outside a toggle header', () => {
    const editor = makeEditor();

    const handled = paste(editor, {
      place: (_header, after) => textSelection(after, 2),
      blocks: () => [paragraph('A'), paragraph('B')],
    });

    expect(handled).toBe(false);
    expect(outlineOfRoot(editor)).toEqual([
      'toggle[Hello world, body[One]]',
      'After',
    ]);
  });

  it('returns false and changes nothing for a selection that starts in the header and ends outside it', () => {
    const editor = makeEditor();

    const handled = paste(editor, {
      place: (header, after) => {
        const selection = textSelection(header, 5);
        const afterText = after.getFirstChildOrThrow();
        selection.focus.set(afterText.getKey(), 2, 'text');
        return selection;
      },
      blocks: () => [paragraph('A'), paragraph('B')],
    });

    expect(handled).toBe(false);
    expect(outlineOfRoot(editor)).toEqual([
      'toggle[Hello world, body[One]]',
      'After',
    ]);
  });
});
