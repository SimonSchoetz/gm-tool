import { describe, expect, it } from 'vitest';
import { $getNodeByKey } from 'lexical';
import { $isListItemNode } from '@lexical/list';
import { wrapperAfter } from '../wrapperAfter';
import { keyOf, list, makeEditor, paragraph } from './support/editorFixtures';

describe('wrapperAfter', () => {
  it('returns the wrapper that holds an item’s sub-items, and null for an item with none, even when another item follows', () => {
    const editor = makeEditor(() => [
      list('bullet', [
        { text: 'a', children: [{ text: 'a1' }] },
        { text: 'b' },
        { text: 'c' },
      ]),
      paragraph('p'),
    ]);

    editor.read('latest', () => {
      const itemNamed = (text: string) => {
        const node = $getNodeByKey(keyOf(editor, text));
        if (!$isListItemNode(node)) throw new Error(`${text} is not an item`);
        return node;
      };
      expect(
        wrapperAfter(itemNamed('a'))?.is(itemNamed('a').getNextSibling()),
      ).toBe(true);
      expect(wrapperAfter(itemNamed('b'))).toBeNull();
      expect(wrapperAfter(itemNamed('c'))).toBeNull();
      expect(wrapperAfter(itemNamed('a1'))).toBeNull();
      const para = $getNodeByKey(keyOf(editor, 'p'));
      if (para === null) throw new Error('p is missing');
      expect(wrapperAfter(para)).toBeNull();
    });
  });
});
