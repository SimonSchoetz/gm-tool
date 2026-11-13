import { describe, expect, it } from 'vitest';
import { $createHeadingNode } from '@lexical/rich-text';
import { $createTextNode, $createParagraphNode, $getRoot } from 'lexical';
import { $createToggleNode } from '../../../../nodes/ToggleNode';
import {
  $caretAt,
  $selectTextOf,
  caretOf,
  body,
  inEditor,
  makeEditor,
  outlineOfRoot,
  rootBlockTypes,
  paragraph,
  setRootChildren,
} from '../toggleFixtures';

describe('toggle fixtures', () => {
  it('outlines a toggle with its header, its body and a toggle inside the body, and a heading by its text', () => {
    const editor = makeEditor();
    setRootChildren(editor, () => [
      $createToggleNode().append(
        paragraph('Header'),
        body('One').append(
          $createToggleNode().append(paragraph('Inner'), body('Deep')),
        ),
      ),
      $createHeadingNode('h2').append($createTextNode('Title')),
    ]);

    expect(outlineOfRoot(editor)).toEqual([
      'toggle[Header, body[One, toggle[Inner, body[Deep]]]]',
      'Title',
    ]);
    expect(rootBlockTypes(editor)).toEqual(['toggle', 'heading']);
  });

  it('replaces the root children each time it is called', () => {
    const editor = makeEditor();
    setRootChildren(editor, () => [paragraph('First')]);
    setRootChildren(editor, () => [paragraph('Second'), paragraph('Third')]);

    expect(outlineOfRoot(editor)).toEqual(['Second', 'Third']);
  });

  it('places a caret as a text point on a text node and as an element point on any other node', () => {
    const editor = makeEditor();

    const points = inEditor(editor, () => {
      const text = $createTextNode('abc');
      const block = $createParagraphNode().append(text);
      const onText = $caretAt(text, 2);
      const onBlock = $caretAt(block, 1);
      return [
        [onText.anchor.type, onText.anchor.offset, onText.isCollapsed()],
        [onBlock.anchor.type, onBlock.anchor.offset, onBlock.isCollapsed()],
      ];
    });

    expect(points).toEqual([
      ['text', 2, true],
      ['element', 1, true],
    ]);
  });

  it('selects a range of the first text of a block, and reads the caret back as its block text and offset', () => {
    const editor = makeEditor();
    inEditor(editor, () => {
      const block = paragraph('Hello world');
      $getRoot().clear().append(block);
      $selectTextOf(block, 3, 3);
    });

    expect(caretOf(editor)).toEqual({ block: 'Hello world', offset: 3 });
  });

  it('reads no caret when the editor has no selection', () => {
    const editor = makeEditor();
    setRootChildren(editor, () => [paragraph('Hello')]);

    expect(caretOf(editor)).toBeNull();
  });
});
