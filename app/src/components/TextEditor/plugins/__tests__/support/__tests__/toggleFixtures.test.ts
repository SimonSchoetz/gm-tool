import { describe, expect, it } from 'vitest';
import { $createHeadingNode } from '@lexical/rich-text';
import { $createTextNode } from 'lexical';
import { $createToggleNode } from '../../../../nodes/ToggleNode';
import {
  body,
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
});
