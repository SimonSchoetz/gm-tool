import { afterEach, describe, expect, it } from 'vitest';
import { $createTextNode, $getNodeByKey, $getRoot } from 'lexical';
import { $createListItemNode, $createListNode } from '@lexical/list';
import { $createHeadingNode } from '@lexical/rich-text';
import type { LexicalEditor } from 'lexical';
import { $isToggleNode } from '../../../../nodes/ToggleNode';
import { collectBlockRows } from '../collectBlockRows';
import {
  keyOf,
  list,
  makeEditor,
  paragraph,
  toggle,
} from './support/editorFixtures';
import type { ItemSpec } from './support/editorFixtures';
import type { LexicalNode } from 'lexical';
import { $createTableNodeWithDimensions } from '@lexical/table';

const rootElements: HTMLElement[] = [];

afterEach(() => {
  rootElements.splice(0).forEach((element) => {
    element.remove();
  });
});

const renderedEditor = (build: () => LexicalNode[]): LexicalEditor => {
  const rootElement = document.createElement('div');
  document.body.appendChild(rootElement);
  rootElements.push(rootElement);
  return makeEditor(build, rootElement);
};

const topLevelKeys = (editor: LexicalEditor): string[] =>
  editor.read('latest', () => $getRoot().getChildrenKeys());

// The key of each row of the document, as the text of the block, toggle header or item it stands for.
const rowTexts = (editor: LexicalEditor): string[] =>
  collectBlockRows(editor).map(({ key }) =>
    editor.read('latest', () => {
      const node = $getNodeByKey(key);
      return $isToggleNode(node)
        ? (node.getFirstChild()?.getTextContent() ?? '')
        : (node?.getTextContent() ?? '');
    }),
  );

const nestedBullets: ItemSpec[] = [
  {
    text: 'a',
    children: [{ text: 'a1', children: [{ text: 'a1i' }] }, { text: 'a2' }],
  },
  { text: 'b' },
];

describe('collectBlockRows', () => {
  it('returns one row per top-level block in document order, each with its node key and rendered element', () => {
    const editor = renderedEditor(() => ['a', 'b', 'c'].map(paragraph));

    const rows = collectBlockRows(editor);

    expect(rows.map(({ key }) => key)).toEqual(topLevelKeys(editor));
    expect(rows.map(({ element }) => element)).toEqual(
      topLevelKeys(editor).map((key) => editor.getElementByKey(key)),
    );
  });

  it('returns no rows for blocks and lists whose element is not rendered', () => {
    const editor = makeEditor(() => [
      paragraph('a'),
      list('bullet', [{ text: 'i', children: [{ text: 'i1' }] }]),
    ]);

    expect(collectBlockRows(editor)).toEqual([]);
  });

  it('carries each row element rectangle top and bottom and computed margins as numbers, an unset margin as 0', () => {
    const editor = renderedEditor(() => ['a', 'b'].map(paragraph));
    const [firstKey, secondKey] = topLevelKeys(editor);
    const first = editor.getElementByKey(firstKey);
    const second = editor.getElementByKey(secondKey);
    if (first === null || second === null)
      throw new Error('block not rendered');
    first.getBoundingClientRect = () =>
      ({ top: 10, bottom: 50, left: 16 }) as DOMRect;
    first.style.marginTop = '6px';
    first.style.marginBottom = '12px';
    second.getBoundingClientRect = () =>
      ({ top: 62, bottom: 90, left: 16 }) as DOMRect;

    const [firstRow, secondRow] = collectBlockRows(editor);

    expect(firstRow).toMatchObject({
      top: 10,
      bottom: 50,
      unitBottom: 50,
      left: 16,
      markerLeft: 16,
      marginTop: 6,
      marginBottom: 12,
    });
    expect(secondRow).toMatchObject({
      top: 62,
      bottom: 90,
      unitBottom: 90,
      marginTop: 0,
      marginBottom: 0,
    });
  });

  it('follows an open toggle’s row with its body blocks, each carrying the keys of the toggles that enclose it, outermost first', () => {
    const editor = renderedEditor(() => [
      paragraph('before'),
      toggle('outer', [
        paragraph('o1'),
        toggle('inner', [paragraph('i1'), paragraph('i2')]),
        paragraph('o2'),
      ]),
      paragraph('after'),
    ]);

    const rows = collectBlockRows(editor);

    expect(rowTexts(editor)).toEqual([
      'before',
      'outer',
      'o1',
      'inner',
      'i1',
      'i2',
      'o2',
      'after',
    ]);
    const outerKey = rows[1].key;
    const innerKey = rows[3].key;
    expect(rows.map(({ ancestry }) => ancestry)).toEqual([
      [],
      [],
      [outerKey],
      [outerKey],
      [outerKey, innerKey],
      [outerKey, innerKey],
      [outerKey],
      [],
    ]);
  });

  it('measures a toggle’s row on its header, with the toggle element’s own bottom, left and margins', () => {
    const editor = renderedEditor(() => [toggle('head', [paragraph('body')])]);
    const toggleKey = keyOf(editor, 'head');
    const toggleElement = editor.getElementByKey(toggleKey);
    const headerElement = editor.read('latest', () => {
      const toggleNode = $getNodeByKey(toggleKey);
      if (!$isToggleNode(toggleNode)) throw new Error('the toggle is missing');
      const header = toggleNode.getFirstChild();
      return header === null ? null : editor.getElementByKey(header.getKey());
    });
    if (toggleElement === null || headerElement === null) {
      throw new Error('toggle not rendered');
    }
    toggleElement.getBoundingClientRect = () =>
      ({ top: 10, bottom: 90, left: 16 }) as DOMRect;
    toggleElement.style.marginBottom = '4px';
    headerElement.getBoundingClientRect = () =>
      ({ top: 10, bottom: 34, left: 48 }) as DOMRect;

    const [row] = collectBlockRows(editor);

    expect(row).toMatchObject({
      key: toggleKey,
      top: 10,
      bottom: 34,
      unitBottom: 90,
      left: 16,
      marginBottom: 4,
    });
  });

  it('leaves out the blocks of a collapsed toggle’s body', () => {
    const editor = renderedEditor(() => [
      toggle('shut', [paragraph('hidden')], true),
      paragraph('after'),
    ]);

    expect(rowTexts(editor)).toEqual(['shut', 'after']);
  });

  it('makes a table one row, never entering its cells', () => {
    const editor = renderedEditor(() => [
      $createTableNodeWithDimensions(2, 2, false),
    ]);

    expect(collectBlockRows(editor)).toHaveLength(1);
  });

  it('makes each real list item a row in document order, a sub-item after its parent item and a nesting wrapper never a row', () => {
    const editor = renderedEditor(() => [list('bullet', nestedBullets)]);

    expect(rowTexts(editor)).toEqual(['a', 'a1', 'a1i', 'a2', 'b']);
  });

  it('gives each item row its depth and the root list’s key, and its ancestry ends with its parent item’s key', () => {
    const editor = renderedEditor(() => [
      paragraph('p'),
      list('bullet', nestedBullets),
    ]);
    const rows = collectBlockRows(editor);
    const byText = (text: string) => rows[rowTexts(editor).indexOf(text)];

    expect(rows[0].list).toBeNull();
    expect(
      ['a', 'a1', 'a1i', 'a2', 'b'].map((text) => byText(text).list?.depth),
    ).toEqual([0, 1, 2, 1, 0]);
    expect(new Set(rows.slice(1).map((row) => row.list?.rootKey)).size).toBe(1);
    expect(byText('a1i').ancestry).toEqual([byText('a').key, byText('a1').key]);
    expect(byText('b').ancestry).toEqual([]);
  });

  it('measures an item row on the item alone, its unit’s end on the wrapper that follows it, and its marker column one list step left of its text', () => {
    const editor = renderedEditor(() => [list('bullet', nestedBullets)]);
    const aKey = keyOf(editor, 'a');
    const aElement = editor.getElementByKey(aKey);
    const wrapperElement = aElement?.nextElementSibling;
    const listElement = aElement?.parentElement;
    if (!(wrapperElement instanceof HTMLElement) || !listElement) {
      throw new Error('item not rendered');
    }
    aElement.getBoundingClientRect = () =>
      ({ top: 0, bottom: 20, left: 40 }) as DOMRect;
    wrapperElement.getBoundingClientRect = () =>
      ({ top: 20, bottom: 90, left: 40 }) as DOMRect;
    wrapperElement.style.marginBottom = '5px';
    listElement.style.paddingLeft = '24px';

    const rows = collectBlockRows(editor);
    const rowOfA = rows[rowTexts(editor).indexOf('a')];

    expect(rowOfA).toMatchObject({
      top: 0,
      bottom: 20,
      unitBottom: 90,
      left: 40,
      markerLeft: 16,
      marginBottom: 5,
    });
    expect(rowOfA.endElement).toBe(wrapperElement);
    const rowOfB = rows[rowTexts(editor).indexOf('b')];
    expect(rowOfB.endElement).toBe(editor.getElementByKey(rowOfB.key));
    expect(rowOfA.list).toMatchObject({ step: 24 });
  });

  it('makes the items of a list in an open toggle’s body rows, the toggle’s key first in their ancestry', () => {
    const editor = renderedEditor(() => [
      toggle('T', [
        list('number', [{ text: 'a', children: [{ text: 'a1' }] }]),
      ]),
    ]);

    const rows = collectBlockRows(editor);

    expect(rowTexts(editor)).toEqual(['T', 'a', 'a1']);
    expect(rows[1].ancestry).toEqual([rows[0].key]);
    expect(rows[2].ancestry).toEqual([rows[0].key, rows[1].key]);
  });

  it('lets a paragraph and a list item join a list, and a heading, a toggle and a table not', () => {
    const editor = renderedEditor(() => [
      paragraph('p'),
      list('bullet', [{ text: 'a' }]),
      toggle('T', []),
      $createTableNodeWithDimensions(1, 1, false),
      $createHeadingNode('h2').append($createTextNode('H')),
    ]);

    expect(
      collectBlockRows(editor).map(({ canJoinList }) => canJoinList),
    ).toEqual([true, true, false, false, false]);
  });

  it('reads the items of a nesting wrapper that has no item before it as rows of the list, and ignores one that follows an item', () => {
    const editor = renderedEditor(() => {
      const wrapperHolding = (text: string) =>
        $createListItemNode().append(
          $createListNode('bullet').append(
            $createListItemNode().append($createTextNode(text)),
          ),
        );
      const real = (text: string) =>
        $createListItemNode().append($createTextNode(text));
      return [
        $createListNode('bullet').append(
          wrapperHolding('x'),
          wrapperHolding('y'),
          real('z'),
          wrapperHolding('z1'),
        ),
      ];
    });

    const rows = collectBlockRows(editor);

    expect(rowTexts(editor)).toEqual(['x', 'y', 'z', 'z1']);
    expect(rows[0].ancestry).toEqual([]);
    expect(rows[1].ancestry).toEqual([]);
    expect(rows[2].ancestry).toEqual([]);
    expect(rows[3].ancestry).toEqual([rows[2].key]);
  });
});
