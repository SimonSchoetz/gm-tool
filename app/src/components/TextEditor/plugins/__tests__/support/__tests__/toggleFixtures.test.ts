import { describe, expect, it } from 'vitest';
import { $createHeadingNode } from '@lexical/rich-text';
import { $createTextNode, $createParagraphNode } from 'lexical';
import { $createToggleNode } from '../../../../nodes/ToggleNode';
import {
  $caretAt,
  body,
  inEditor,
  makeEditor,
  outlineOfRoot,
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
});
