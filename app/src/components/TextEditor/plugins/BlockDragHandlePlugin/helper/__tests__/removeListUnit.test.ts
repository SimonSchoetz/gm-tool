import { describe, expect, it } from 'vitest';
import { $getNodeByKey } from 'lexical';
import { removeListUnit } from '../removeListUnit';
import {
  keyOf,
  list,
  makeEditor,
  outlineOf,
  paragraph,
} from './support/editorFixtures';

const remove = (editor: ReturnType<typeof makeEditor>, text: string) => {
  const key = keyOf(editor, text);
  editor.update(
    () => {
      const node = $getNodeByKey(key);
      if (node === null) throw new Error(`${text} is missing`);
      removeListUnit(node);
    },
    { discrete: true },
  );
};

describe('removeListUnit', () => {
  it('removes an item together with its sub-items', () => {
    const editor = makeEditor(() => [
      list('bullet', [
        { text: 'a', children: [{ text: 'a1', children: [{ text: 'a1i' }] }] },
        { text: 'b' },
      ]),
    ]);

    remove(editor, 'a');

    expect(outlineOf(editor)).toEqual(['bullet(b)']);
  });

  it('removes the nesting wrapper left empty when the last item of a nested list goes', () => {
    const editor = makeEditor(() => [
      list('bullet', [
        { text: 'a', children: [{ text: 'a1' }] },
        { text: 'b' },
      ]),
    ]);

    remove(editor, 'a1');

    expect(outlineOf(editor)).toEqual(['bullet(a,b)']);
  });

  it('keeps the nesting wrapper of a nested list that still has items', () => {
    const editor = makeEditor(() => [
      list('bullet', [
        { text: 'a', children: [{ text: 'a1' }, { text: 'a2' }] },
      ]),
    ]);

    remove(editor, 'a1');

    expect(outlineOf(editor)).toEqual(['bullet(a[a2])']);
  });

  it('removes a list that loses its last item', () => {
    const editor = makeEditor(() => [list('bullet', [{ text: 'only' }])]);

    remove(editor, 'only');

    expect(outlineOf(editor)).toEqual([]);
  });

  it('removes a paragraph', () => {
    const editor = makeEditor(() => [paragraph('a'), paragraph('b')]);

    remove(editor, 'a');

    expect(outlineOf(editor)).toEqual(['b']);
  });
});
