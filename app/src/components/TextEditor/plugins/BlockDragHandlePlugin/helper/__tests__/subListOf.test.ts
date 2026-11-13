import { describe, expect, it } from 'vitest';
import { $getNodeByKey } from 'lexical';
import { $isListNode } from '@lexical/list';
import { subListOf } from '../subListOf';
import { keyOf, list, makeEditor, paragraph } from './support/editorFixtures';

describe('subListOf', () => {
  it('returns the list a nesting wrapper holds, and null for a real item, a list, a paragraph and null', () => {
    const editor = makeEditor(() => [
      list('bullet', [{ text: 'a', children: [{ text: 'a1' }] }]),
      paragraph('p'),
    ]);

    editor.read('latest', () => {
      const item = $getNodeByKey(keyOf(editor, 'a'));
      const wrapper = item?.getNextSibling() ?? null;
      const sub = subListOf(wrapper);
      expect($isListNode(sub)).toBe(true);
      expect(sub?.getChildrenSize()).toBe(1);
      expect(subListOf(item)).toBeNull();
      expect(subListOf(item?.getParent() ?? null)).toBeNull();
      expect(subListOf($getNodeByKey(keyOf(editor, 'p')))).toBeNull();
      expect(subListOf(null)).toBeNull();
    });
  });
});
