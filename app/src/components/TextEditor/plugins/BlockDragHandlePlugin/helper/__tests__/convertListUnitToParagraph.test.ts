import { describe, expect, it } from 'vitest';
import { $getNodeByKey } from 'lexical';
import { $isListItemNode } from '@lexical/list';
import { convertListUnitToParagraph } from '../convertListUnitToParagraph';
import {
  keyOf,
  list,
  makeEditor,
  outlineOf,
  paragraph,
  rootListKeyOf,
} from './support/editorFixtures';

const convert = (
  editor: ReturnType<typeof makeEditor>,
  item: string,
  target: string,
  placement: 'before' | 'after',
) => {
  const itemKey = keyOf(editor, item);
  const targetKey = keyOf(editor, target);
  editor.update(
    () => {
      const itemNode = $getNodeByKey(itemKey);
      const targetNode = $getNodeByKey(targetKey);
      if (!$isListItemNode(itemNode) || targetNode === null) {
        throw new Error('not a list item');
      }
      convertListUnitToParagraph(itemNode, targetNode, placement);
    },
    { discrete: true },
  );
};

describe('convertListUnitToParagraph', () => {
  it('places the paragraph after the target and the sub-items’ list directly after the paragraph', () => {
    const editor = makeEditor(() => [
      list('number', [
        { text: 'a', children: [{ text: 'a1', children: [{ text: 'a1i' }] }] },
      ]),
      paragraph('t'),
      paragraph('u'),
    ]);

    convert(editor, 'a', 't', 'after');

    expect(outlineOf(editor)).toEqual(['t', 'a', 'number(a1[a1i])', 'u']);
  });

  it('places the paragraph before the target, and adds no list for an item without sub-items', () => {
    const editor = makeEditor(() => [
      list('bullet', [{ text: 'a' }, { text: 'b' }]),
      paragraph('t'),
    ]);

    convert(editor, 'b', 't', 'before');

    expect(outlineOf(editor)).toEqual(['bullet(a)', 'b', 't']);
  });

  it('puts the paragraph beside the item’s own list when that is the target, though Lexical removes the list with its last item', () => {
    const editor = makeEditor(() => [
      list('bullet', [{ text: 'only', children: [{ text: 'o1' }] }]),
    ]);
    const listKey = rootListKeyOf(editor, 'only');
    const itemKey = keyOf(editor, 'only');

    editor.update(
      () => {
        const item = $getNodeByKey(itemKey);
        const target = $getNodeByKey(listKey);
        if (!$isListItemNode(item) || target === null) {
          throw new Error('not a list item');
        }
        convertListUnitToParagraph(item, target, 'after');
      },
      { discrete: true },
    );

    expect(outlineOf(editor)).toEqual(['only', 'bullet(o1)']);
  });
});
