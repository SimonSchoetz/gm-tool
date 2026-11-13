import { describe, expect, it } from 'vitest';
import { $getNodeByKey } from 'lexical';
import { $createListNode, $isListItemNode } from '@lexical/list';
import type { ListItemNode } from '@lexical/list';
import { rebuildListUnit } from '../rebuildListUnit';
import { keyOf, list, makeEditor } from './support/editorFixtures';

const rebuild = (
  editor: ReturnType<typeof makeEditor>,
  text: string,
  inspect: (
    original: ListItemNode,
    rebuilt: ReturnType<typeof rebuildListUnit>,
  ) => void,
) => {
  const key = keyOf(editor, text);
  editor.update(
    () => {
      const original = $getNodeByKey(key);
      if (!$isListItemNode(original)) throw new Error('not a list item');
      inspect(original, rebuildListUnit(original));
    },
    { discrete: true },
  );
};

describe('rebuildListUnit', () => {
  it('returns one detached copy for an item with no sub-items, at depth 0', () => {
    const editor = makeEditor(() => [
      list('bullet', [{ text: 'a' }, { text: 'b' }]),
    ]);

    rebuild(editor, 'a', (_original, rebuilt) => {
      expect(rebuilt).toHaveLength(1);
      expect(rebuilt[0].relativeDepth).toBe(0);
      expect(rebuilt[0].item.getTextContent()).toBe('a');
      expect(rebuilt[0].item.isAttached()).toBe(false);
    });
  });

  it('returns the sub-items in document order with their depth below the unit’s own item', () => {
    const editor = makeEditor(() => [
      list('bullet', [
        {
          text: 'a',
          children: [
            { text: 'a1', children: [{ text: 'a1i' }] },
            { text: 'a2' },
          ],
        },
        { text: 'b' },
      ]),
    ]);

    rebuild(editor, 'a', (_original, rebuilt) => {
      expect(
        rebuilt.map(
          ({ item, relativeDepth }) =>
            `${relativeDepth} ${item.getTextContent()}`,
        ),
      ).toEqual(['0 a', '1 a1', '2 a1i', '1 a2']);
    });
  });

  it('keeps each item’s check state', () => {
    const editor = makeEditor(() => [
      list('check', [
        {
          text: 'c',
          checked: true,
          children: [{ text: 'c1' }, { text: 'c2', checked: true }],
        },
      ]),
    ]);

    rebuild(editor, 'c', (_original, rebuilt) => {
      // An item reads its check state through the list it is in, so the copies are put in a check list.
      $createListNode('check').append(...rebuilt.map(({ item }) => item));

      expect(rebuilt.map(({ item }) => item.getChecked())).toEqual([
        true,
        false,
        true,
      ]);
    });
  });

  it('moves the children into the copies and leaves the originals childless', () => {
    const editor = makeEditor(() => [
      list('bullet', [{ text: 'a', children: [{ text: 'a1' }] }]),
    ]);

    rebuild(editor, 'a', (original, rebuilt) => {
      const [own, sub] = rebuilt;
      expect(own.item.getTextContent()).toBe('a');
      expect(sub.item.getTextContent()).toBe('a1');
      expect(original.getChildrenSize()).toBe(0);
    });
  });
});
