import { describe, expect, it } from 'vitest';
import { $getNodeByKey, $isParagraphNode } from 'lexical';
import { $isListItemNode } from '@lexical/list';
import type { LexicalEditor } from 'lexical';
import { moveListUnit } from '../moveListUnit';
import {
  keyOf,
  list,
  makeEditor,
  outlineOf,
  paragraph,
} from './support/editorFixtures';

const moveUnit = (
  editor: LexicalEditor,
  dragged: string,
  target: string,
  placement: 'before' | 'after',
  depth: number,
): void => {
  const draggedKey = keyOf(editor, dragged);
  const targetKey = keyOf(editor, target);
  editor.update(
    () => {
      const draggedNode = $getNodeByKey(draggedKey);
      const targetNode = $getNodeByKey(targetKey);
      if (
        !($isListItemNode(draggedNode) || $isParagraphNode(draggedNode)) ||
        !$isListItemNode(targetNode)
      ) {
        throw new Error('not a movable unit');
      }
      moveListUnit(draggedNode, targetNode, placement, depth);
    },
    { discrete: true },
  );
};

const document = () =>
  makeEditor(() => [
    list('bullet', [
      { text: 'a', children: [{ text: 'a1' }, { text: 'a2' }] },
      { text: 'b' },
      { text: 'c' },
    ]),
    paragraph('p'),
  ]);

describe('moveListUnit', () => {
  it('puts the unit as the first child of an item that has no sub-items, one level deeper', () => {
    const editor = document();

    moveUnit(editor, 'c', 'b', 'after', 1);

    expect(outlineOf(editor)).toEqual(['bullet(a[a1,a2],b[c])', 'p']);
  });

  it('puts the unit after an item’s sub-items when it lands after that item at the item’s own depth', () => {
    const editor = document();

    moveUnit(editor, 'c', 'a', 'after', 0);

    expect(outlineOf(editor)).toEqual(['bullet(a[a1,a2],c,b)', 'p']);
  });

  it('puts the unit before an item, taking that item’s depth', () => {
    const editor = document();

    moveUnit(editor, 'c', 'a2', 'before', 1);

    expect(outlineOf(editor)).toEqual(['bullet(a[a1,c,a2],b)', 'p']);
  });

  it('turns a paragraph into an item at the chosen depth', () => {
    const editor = document();

    moveUnit(editor, 'p', 'a1', 'after', 1);

    expect(outlineOf(editor)).toEqual(['bullet(a[a1,p,a2],b,c)']);
  });

  it('writes nothing when the item is already directly before the target or directly after it', () => {
    const editor = document();
    let commits = 0;
    editor.registerUpdateListener(() => {
      commits += 1;
    });

    moveUnit(editor, 'b', 'c', 'before', 0);
    moveUnit(editor, 'b', 'a', 'after', 0);

    expect(outlineOf(editor)).toEqual(['bullet(a[a1,a2],b,c)', 'p']);
    expect(commits).toBe(0);
  });

  it('moves an item that is not at the position, even at the same depth', () => {
    const editor = document();

    moveUnit(editor, 'a', 'c', 'after', 0);

    expect(outlineOf(editor)).toEqual(['bullet(b,c,a[a1,a2])', 'p']);
  });

  it('puts the unit first among the sub-items of a target that has some, when it lands one level deeper', () => {
    const editor = document();

    moveUnit(editor, 'c', 'a', 'after', 1);

    expect(outlineOf(editor)).toEqual(['bullet(a[c,a1,a2],b)', 'p']);
  });

  it('keeps every level of a unit that is three levels deep', () => {
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

    moveUnit(editor, 'a', 'b', 'after', 0);

    expect(outlineOf(editor)).toEqual(['bullet(b,a[a1[a1i],a2])']);
  });
});
