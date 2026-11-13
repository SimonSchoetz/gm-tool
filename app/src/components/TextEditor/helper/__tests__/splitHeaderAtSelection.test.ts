import { describe, expect, it } from 'vitest';
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  type LexicalEditor,
  type LexicalNode,
} from 'lexical';
import { $createHeadingNode, $isHeadingNode } from '@lexical/rich-text';
import { $createToggleNode } from '../../nodes/ToggleNode';
import { $createToggleBodyNode } from '../../nodes/ToggleBodyNode';
import { splitHeaderAtSelection } from '../splitHeaderAtSelection';
import {
  $firstToggle,
  body,
  inEditor,
  makeEditor,
  outlineOfRoot,
  paragraph,
  setRootChildren,
} from '../../plugins/__tests__/support/toggleFixtures';

// Splits 'Hello world' after 'Hello' in the header of a toggle holding `children` after the header, and returns the text of the block the split returned.
const splitAfterHello = (
  editor: LexicalEditor,
  makeToggle: (header: LexicalNode) => LexicalNode,
) =>
  inEditor(editor, () => {
    const text = $createTextNode('Hello world');
    const header = $createParagraphNode().append(text);
    $getRoot().clear().append(makeToggle(header));
    text.select(5, 5);
    const selection = text.select(5, 5);
    return splitHeaderAtSelection(selection).getTextContent();
  });

describe('splitHeaderAtSelection', () => {
  it('leaves the text before the caret in the header and puts the text after it at the start of an open toggle body, ahead of the body blocks', () => {
    const editor = makeEditor();

    const returnedText = splitAfterHello(editor, (header) =>
      $createToggleNode().append(header, body('One')),
    );

    expect(returnedText).toBe(' world');
    expect(outlineOfRoot(editor)).toEqual(['toggle[Hello, body[ world, One]]']);
  });

  it('puts the text after the caret directly after a collapsed toggle, not into its body', () => {
    const editor = makeEditor();

    const returnedText = splitAfterHello(editor, (header) =>
      $createToggleNode(true).append(header, body('One')),
    );

    expect(returnedText).toBe(' world');
    expect(
      editor.getEditorState().read(() => $getRoot().getChildren().length),
    ).toBe(2);
    expect(outlineOfRoot(editor)).toEqual([
      'toggle[Hello, body[One]]',
      ' world',
    ]);
  });

  it('gives an open toggle with an empty body the split-off block as its only body block', () => {
    const editor = makeEditor();

    splitAfterHello(editor, (header) =>
      $createToggleNode().append(header, $createToggleBodyNode()),
    );

    expect(outlineOfRoot(editor)).toEqual(['toggle[Hello, body[ world]]']);
  });

  it('puts the text after the caret directly after a toggle that has no body', () => {
    const editor = makeEditor();

    splitAfterHello(editor, (header) => $createToggleNode().append(header));

    expect(outlineOfRoot(editor)).toEqual(['toggle[Hello]', ' world']);
  });

  it('keeps a heading header a heading of its level and gives the split-off block the same level', () => {
    const editor = makeEditor();

    const levels = inEditor(editor, () => {
      const text = $createTextNode('Hello world');
      const header = $createHeadingNode('h2').append(text);
      const toggle = $createToggleNode().append(header, body('One'));
      $getRoot().clear().append(toggle);
      const newBlock = splitHeaderAtSelection(text.select(5, 5));
      return [header, newBlock].map((block) =>
        $isHeadingNode(block) ? block.getTag() : block.getType(),
      );
    });

    expect(levels).toEqual(['h2', 'h2']);
  });

  it.each([
    ['a paragraph', () => $createParagraphNode(), 'paragraph'],
    ['a heading', () => $createHeadingNode('h2'), 'heading'],
  ])(
    'keeps the header node itself, as the header type it was, when %s is split in the middle',
    (_name, makeHeader, headerType) => {
      const editor = makeEditor();

      const result = inEditor(editor, () => {
        const text = $createTextNode('Hello world');
        const header = makeHeader().append(text);
        const toggle = $createToggleNode().append(header, body('One'));
        $getRoot().clear().append(toggle);
        splitHeaderAtSelection(text.select(5, 5));
        const current = toggle.getFirstChildOrThrow();
        return { sameNode: current.is(header), type: current.getType() };
      });

      expect(result).toEqual({ sameNode: true, type: headerType });
    },
  );

  it('keeps a heading header a heading when the caret is at the start of its text, the text moving to the split-off block', () => {
    const editor = makeEditor();

    const result = inEditor(editor, () => {
      const text = $createTextNode('Hello world');
      const header = $createHeadingNode('h2').append(text);
      const toggle = $createToggleNode().append(header, body('One'));
      $getRoot().clear().append(toggle);
      const newBlock = splitHeaderAtSelection(text.select(0, 0));
      const currentHeader = toggle.getFirstChildOrThrow();
      return {
        headerType: currentHeader.getType(),
        headerText: currentHeader.getTextContent(),
        newBlockText: newBlock.getTextContent(),
      };
    });

    expect(result).toEqual({
      headerType: 'heading',
      headerText: '',
      newBlockText: 'Hello world',
    });
  });

  it('leaves the toggle with exactly its header and its body, whatever the body holds', () => {
    const editor = makeEditor();

    splitAfterHello(editor, (header) =>
      $createToggleNode().append(header, body('One', 'Two')),
    );

    expect(
      editor.getEditorState().read(() => $firstToggle().getChildrenSize()),
    ).toBe(2);
  });

  it('throws for a caret outside a toggle header', () => {
    const editor = makeEditor();
    setRootChildren(editor, () => [paragraph('Plain')]);

    expect(() =>
      inEditor(editor, () => {
        const text = $createTextNode('Hello world');
        $getRoot().clear().append($createParagraphNode().append(text));
        return splitHeaderAtSelection(text.select(5, 5));
      }),
    ).toThrow(/^splitHeaderAtSelection: the caret is not in a toggle header$/);
  });
});
