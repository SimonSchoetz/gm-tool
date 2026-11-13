import { describe, expect, it } from 'vitest';
import {
  $createParagraphNode,
  $createTextNode,
  $getNodeByKey,
  $isParagraphNode,
  $isTextNode,
} from 'lexical';
import { convertToListItem } from '../convertToListItem';
import {
  keyOf,
  makeEditor,
  outlineOf,
  paragraph,
} from './support/editorFixtures';

describe('convertToListItem', () => {
  it('returns an item holding the paragraph’s children, text and inline formatting, and leaves the emptied paragraph to the caller', () => {
    const editor = makeEditor(() => [
      paragraph('keep'),
      $createParagraphNode().append(
        $createTextNode('strong').toggleFormat('bold'),
      ),
    ]);
    const key = keyOf(editor, 'strong');

    editor.update(
      () => {
        const node = $getNodeByKey(key);
        if (!$isParagraphNode(node)) throw new Error('not a paragraph');
        const item = convertToListItem(node);
        expect(item.getTextContent()).toBe('strong');
        const [text] = item.getChildren();
        expect($isTextNode(text) && text.hasFormat('bold')).toBe(true);
        expect(item.isAttached()).toBe(false);
      },
      { discrete: true },
    );

    expect(outlineOf(editor)).toEqual(['keep', '(empty)']);
  });
});
