import { describe, expect, it } from 'vitest';
import {
  $createParagraphNode,
  $createTextNode,
  $getNodeByKey,
  $isTextNode,
  HISTORY_PUSH_TAG,
} from 'lexical';
import type { LexicalEditor } from 'lexical';
import { $isListItemNode } from '@lexical/list';
import type { DropPlacement } from '../collectBlockRows';
import { moveBlock } from '../moveBlock';
import {
  keyOf,
  list,
  makeEditor,
  outlineOf,
  paragraph,
  toggle,
} from './support/editorFixtures';

const move = (
  editor: LexicalEditor,
  dragged: string,
  target: string,
  placement: DropPlacement,
  depth: number | null = null,
) => {
  const draggedKey = keyOf(editor, dragged);
  const targetKey = keyOf(editor, target);
  editor.update(
    () => {
      moveBlock(draggedKey, targetKey, placement, depth);
    },
    { discrete: true },
  );
};

const nested = () =>
  makeEditor(() => [
    paragraph('a'),
    toggle('T', [paragraph('x'), paragraph('y')]),
    paragraph('b'),
    toggle('U', [paragraph('z')]),
  ]);

describe('moveBlock', () => {
  it('puts the dragged block before the target block, the other blocks keeping their order', () => {
    const editor = makeEditor(() => ['a', 'b', 'c', 'd'].map(paragraph));

    move(editor, 'd', 'b', 'before');

    expect(outlineOf(editor)).toEqual(['a', 'd', 'b', 'c']);
  });

  it('puts the dragged block after the target block, the other blocks keeping their order', () => {
    const editor = makeEditor(() => ['a', 'b', 'c', 'd'].map(paragraph));

    move(editor, 'a', 'c', 'after');

    expect(outlineOf(editor)).toEqual(['b', 'c', 'a', 'd']);
  });

  it('moves a block to the first position and to the last position', () => {
    const editor = makeEditor(() => ['a', 'b', 'c'].map(paragraph));

    move(editor, 'c', 'a', 'before');
    expect(outlineOf(editor)).toEqual(['c', 'a', 'b']);

    move(editor, 'c', 'b', 'after');
    expect(outlineOf(editor)).toEqual(['a', 'b', 'c']);
  });

  it('leaves the order alone and commits no update for a position that is the block’s own', () => {
    const editor = makeEditor(() => ['a', 'b', 'c'].map(paragraph));
    let commits = 0;
    editor.registerUpdateListener(() => {
      commits += 1;
    });

    move(editor, 'b', 'b', 'before');
    move(editor, 'b', 'b', 'after');
    move(editor, 'b', 'a', 'after');
    move(editor, 'b', 'c', 'before');

    expect(outlineOf(editor)).toEqual(['a', 'b', 'c']);
    expect(commits).toBe(0);
  });

  it('leaves the order alone when the dragged block or the target block no longer exists', () => {
    const editor = makeEditor(() => ['a', 'b'].map(paragraph));
    const existingKey = keyOf(editor, 'a');

    editor.update(
      () => {
        moveBlock('no-such-block', existingKey, 'after', null);
        moveBlock(existingKey, 'no-such-block', 'after', null);
      },
      { discrete: true },
    );

    expect(outlineOf(editor)).toEqual(['a', 'b']);
  });

  it('tags a move as its own history entry, so one undo reverts the drop and not the typing before it', () => {
    const editor = makeEditor(() => ['a', 'b'].map(paragraph));
    const tags: Set<string>[] = [];
    editor.registerUpdateListener(({ tags: updateTags }) => {
      tags.push(updateTags);
    });

    move(editor, 'a', 'b', 'after');

    expect(tags).toHaveLength(1);
    expect(tags[0].has(HISTORY_PUSH_TAG)).toBe(true);
  });

  it('keeps the moved block’s text and its inline formatting', () => {
    const editor = makeEditor(() => [
      paragraph('plain'),
      $createParagraphNode().append(
        $createTextNode('strong').toggleFormat('bold'),
      ),
    ]);

    move(editor, 'strong', 'plain', 'before');

    const [moved] = editor.getEditorState().toJSON().root.children;
    expect(moved).toMatchObject({
      children: [{ text: 'strong', format: 1 }],
    });
  });

  it('moves a block into a toggle’s body, between its blocks and out of it', () => {
    const editor = nested();

    move(editor, 'a', 'x', 'before');
    expect(outlineOf(editor)).toEqual(['T{a,x,y}', 'b', 'U{z}']);

    move(editor, 'b', 'x', 'after');
    expect(outlineOf(editor)).toEqual(['T{a,x,b,y}', 'U{z}']);

    move(editor, 'y', 'T', 'after');
    expect(outlineOf(editor)).toEqual(['T{a,x,b}', 'y', 'U{z}']);
  });

  it('moves a toggle into another toggle’s body with its own body', () => {
    const editor = nested();

    move(editor, 'U', 'x', 'after');

    expect(outlineOf(editor)).toEqual(['a', 'T{x,U{z},y}', 'b']);
  });

  it('changes nothing when the target is inside the dragged block', () => {
    const editor = nested();
    let commits = 0;
    editor.registerUpdateListener(() => {
      commits += 1;
    });

    move(editor, 'T', 'x', 'before');
    move(editor, 'T', 'y', 'after');

    expect(outlineOf(editor)).toEqual(['a', 'T{x,y}', 'b', 'U{z}']);
    expect(commits).toBe(0);
  });

  it('leaves one empty paragraph in a toggle body that a move empties, and adds nothing to a body that keeps blocks', () => {
    const editor = nested();

    move(editor, 'z', 'a', 'before');
    expect(outlineOf(editor)).toEqual(['z', 'a', 'T{x,y}', 'b', 'U{(empty)}']);

    move(editor, 'x', 'a', 'after');
    expect(outlineOf(editor)).toEqual([
      'z',
      'a',
      'x',
      'T{y}',
      'b',
      'U{(empty)}',
    ]);
  });

  it('moves a list item with its sub-items, keeping their relative depths, to a shallower position and a deeper one', () => {
    const editor = makeEditor(() => [
      list('bullet', [
        { text: 'a' },
        { text: 'b', children: [{ text: 'b1', children: [{ text: 'b1i' }] }] },
        { text: 'c' },
      ]),
    ]);

    move(editor, 'b1', 'b', 'after', 0);
    expect(outlineOf(editor)).toEqual(['bullet(a,b,b1[b1i],c)']);

    move(editor, 'b1', 'a', 'after', 1);
    expect(outlineOf(editor)).toEqual(['bullet(a[b1[b1i]],b,c)']);
  });

  it('moves a list item to the start of its list and a list item with sub-items to the end of another list', () => {
    const editor = makeEditor(() => [
      list('bullet', [
        { text: 'a' },
        { text: 'b', children: [{ text: 'b1' }] },
      ]),
      list('number', [{ text: 'n' }]),
    ]);

    move(editor, 'b', 'a', 'before', 0);
    expect(outlineOf(editor)).toEqual(['bullet(b[b1],a)', 'number(n)']);

    move(editor, 'b', 'n', 'after', 0);
    expect(outlineOf(editor)).toEqual(['bullet(a)', 'number(n,b[b1])']);
  });

  it('turns a list item into an item of the style of the list it lands in, with every sub-item of that style, and keeps a check state only in a check list', () => {
    const editor = makeEditor(() => [
      list('check', [
        { text: 'c', checked: true, children: [{ text: 'c1', checked: true }] },
      ]),
      list('bullet', [{ text: 'b' }]),
      list('check', [{ text: 'd' }]),
    ]);

    move(editor, 'c', 'b', 'after', 0);
    expect(outlineOf(editor)).toEqual(['bullet(b,c[c1])', 'check(☐d)']);

    move(editor, 'c', 'd', 'after', 0);
    expect(outlineOf(editor)).toEqual(['bullet(b)', 'check(☐d,☐c[☐c1])']);
  });

  it('keeps a check item’s checked state when it moves between check lists', () => {
    const editor = makeEditor(() => [
      list('check', [{ text: 'c', checked: true }]),
      paragraph('gap'),
      list('check', [{ text: 'd' }]),
    ]);

    move(editor, 'c', 'd', 'after', 0);

    expect(outlineOf(editor)).toEqual(['gap', 'check(☐d,✓c)']);
  });

  it('turns a paragraph dropped into a list into an item of that list’s style, with its text and inline formatting, at the chosen depth', () => {
    const editor = makeEditor(() => [
      paragraph('p'),
      list('number', [{ text: 'a' }, { text: 'b' }]),
      list('check', [{ text: 'c' }]),
      $createParagraphNode().append(
        $createTextNode('strong').toggleFormat('bold'),
      ),
    ]);

    move(editor, 'p', 'a', 'after', 1);
    expect(outlineOf(editor)).toEqual([
      'number(a[p],b)',
      'check(☐c)',
      'strong',
    ]);

    move(editor, 'strong', 'c', 'after', 0);
    expect(outlineOf(editor)).toEqual(['number(a[p],b)', 'check(☐c,☐strong)']);
    const keepsBold = editor.read('latest', () => {
      const item = $getNodeByKey(keyOf(editor, 'strong'));
      const text = $isListItemNode(item) ? item.getFirstChild() : null;
      return $isTextNode(text) && text.hasFormat('bold');
    });
    expect(keepsBold).toBe(true);
  });

  it('turns a list item dropped outside every list into a paragraph, its sub-items following as a list of the same style one level shallower', () => {
    const editor = makeEditor(() => [
      list('check', [
        {
          text: 'c',
          checked: true,
          children: [
            { text: 'c1', checked: true, children: [{ text: 'c1i' }] },
            { text: 'c2' },
          ],
        },
      ]),
      paragraph('after'),
    ]);

    move(editor, 'c', 'after', 'after', null);

    expect(outlineOf(editor)).toEqual(['after', 'c', 'check(✓c1[☐c1i],☐c2)']);
  });

  it('turns a list item without sub-items into a paragraph beside a list, removes the list it leaves empty and renumbers the rest', () => {
    const editor = makeEditor(() => [
      list('number', [{ text: 'a' }, { text: 'b' }, { text: 'c' }]),
      list('bullet', [{ text: 'only' }]),
    ]);

    move(editor, 'a', 'b', 'after', 1);
    move(editor, 'only', 'c', 'after', null);

    expect(outlineOf(editor)).toEqual(['number(b[a],c)', 'only']);
    const [numbered] = editor.getEditorState().toJSON().root
      .children as unknown as { children: { value: number }[] }[];
    expect(numbered.children.map(({ value }) => value)).toEqual([1, 2, 2]);
    expect(
      editor
        .getEditorState()
        .toJSON()
        .root.children.map(
          (block) => (block as { listType?: string }).listType ?? null,
        ),
    ).toEqual(['number', null]);
  });

  it('leaves one empty paragraph in a toggle body whose only list is emptied by a move', () => {
    const editor = makeEditor(() => [
      paragraph('a'),
      toggle('T', [list('bullet', [{ text: 'x' }])]),
    ]);

    move(editor, 'x', 'a', 'before', null);

    expect(outlineOf(editor)).toEqual(['x', 'a', 'T{(empty)}']);
  });

  it('changes nothing and commits no update for a list item dropped where it already stands, at its own depth', () => {
    const editor = makeEditor(() => [
      list('bullet', [
        { text: 'a', children: [{ text: 'a1' }, { text: 'a2' }] },
        { text: 'b' },
      ]),
    ]);
    let commits = 0;
    editor.registerUpdateListener(() => {
      commits += 1;
    });

    move(editor, 'a2', 'a1', 'after', 1);
    move(editor, 'a1', 'a2', 'before', 1);
    move(editor, 'b', 'a', 'after', 0);
    move(editor, 'a', 'b', 'before', 0);

    expect(outlineOf(editor)).toEqual(['bullet(a[a1,a2],b)']);
    expect(commits).toBe(0);
  });

  it('changes nothing when the target is among the dragged item’s own sub-items', () => {
    const editor = makeEditor(() => [
      list('bullet', [
        { text: 'a', children: [{ text: 'a1' }] },
        { text: 'b' },
      ]),
    ]);

    move(editor, 'a', 'a1', 'after', 2);

    expect(outlineOf(editor)).toEqual(['bullet(a[a1],b)']);
  });

  it('moves nothing when a block that cannot join a list is given a list depth, or a paragraph is given a depth beside a block that is not a list item', () => {
    const editor = makeEditor(() => [
      paragraph('a'),
      toggle('T', [paragraph('x')]),
      list('bullet', [{ text: 'i' }]),
    ]);
    let commits = 0;
    editor.registerUpdateListener(() => {
      commits += 1;
    });

    move(editor, 'T', 'i', 'after', 0);
    move(editor, 'a', 'T', 'after', 0);

    expect(outlineOf(editor)).toEqual(['a', 'T{x}', 'bullet(i)']);
    expect(commits).toBe(0);
  });

  it('moves a list item three levels deep with all its sub-items', () => {
    const editor = makeEditor(() => [
      list('bullet', [
        {
          text: 'a',
          children: [
            { text: 'a1', children: [{ text: 'a1i' }] },
            { text: 'a2' },
          ],
        },
      ]),
      paragraph('p'),
    ]);

    move(editor, 'a', 'p', 'after', null);

    expect(outlineOf(editor)).toEqual(['p', 'a', 'bullet(a1[a1i],a2)']);
  });
});
