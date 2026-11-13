import { afterEach, describe, expect, it } from 'vitest';
import {
  $createParagraphNode,
  $createTextNode,
  $getNodeByKey,
  $getRoot,
  createEditor,
} from 'lexical';
import type { LexicalEditor, LexicalNode } from 'lexical';
import {
  $createListItemNode,
  $createListNode,
  ListItemNode,
  ListNode,
} from '@lexical/list';
import {
  $createTableNodeWithDimensions,
  TableCellNode,
  TableNode,
  TableRowNode,
} from '@lexical/table';
import {
  $createToggleNode,
  $isToggleNode,
  ToggleNode,
} from '../../../../nodes/ToggleNode';
import {
  $createToggleBodyNode,
  ToggleBodyNode,
} from '../../../../nodes/ToggleBodyNode';
import { collectBlockRows } from '../collectBlockRows';

const rootElements: HTMLElement[] = [];

afterEach(() => {
  rootElements.splice(0).forEach((element) => {
    element.remove();
  });
});

const paragraph = (text: string) =>
  $createParagraphNode().append($createTextNode(text));

const toggle = (header: string, body: LexicalNode[], collapsed = false) =>
  $createToggleNode(collapsed).append(
    paragraph(header),
    $createToggleBodyNode().append(...body),
  );

const makeEditor = (
  build: () => LexicalNode[],
  { rendered }: { rendered: boolean } = { rendered: true },
): LexicalEditor => {
  const editor = createEditor({
    nodes: [
      ToggleNode,
      ToggleBodyNode,
      ListNode,
      ListItemNode,
      TableNode,
      TableRowNode,
      TableCellNode,
    ],
    onError: (error: Error) => {
      throw error;
    },
  });
  if (rendered) {
    const rootElement = document.createElement('div');
    document.body.appendChild(rootElement);
    rootElements.push(rootElement);
    editor.setRootElement(rootElement);
  }
  editor.update(
    () => {
      $getRoot().append(...build());
    },
    { discrete: true },
  );
  return editor;
};

const topLevelKeys = (editor: LexicalEditor): string[] =>
  editor.read('latest', () => $getRoot().getChildrenKeys());

// The text of a row's own block: a toggle row is read by its header.
const rowTexts = (editor: LexicalEditor): string[] =>
  collectBlockRows(editor).map(({ key }) =>
    editor.read('latest', () => {
      const node = $getNodeByKey(key);
      return $isToggleNode(node)
        ? (node.getFirstChild()?.getTextContent() ?? '')
        : (node?.getTextContent() ?? '');
    }),
  );

describe('collectBlockRows', () => {
  it('returns one row per top-level block in document order, each with its node key and rendered element', () => {
    const editor = makeEditor(() => [
      paragraph('a'),
      paragraph('b'),
      paragraph('c'),
    ]);

    const rows = collectBlockRows(editor);

    expect(rows.map(({ key }) => key)).toEqual(topLevelKeys(editor));
    expect(rows.map(({ element }) => element)).toEqual(
      topLevelKeys(editor).map((key) => editor.getElementByKey(key)),
    );
  });

  it('returns no rows for blocks whose element is not rendered', () => {
    const editor = makeEditor(() => [paragraph('a'), paragraph('b')], {
      rendered: false,
    });

    expect(collectBlockRows(editor)).toEqual([]);
  });

  it('carries each row element rectangle top and bottom and computed margins as numbers, an unset margin as 0', () => {
    const editor = makeEditor(() => [paragraph('a'), paragraph('b')]);
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
    const editor = makeEditor(() => [
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
    const editor = makeEditor(() => [toggle('head', [paragraph('body')])]);
    const [toggleRowKey] = topLevelKeys(editor);
    const toggleElement = editor.getElementByKey(toggleRowKey);
    const headerElement = editor.read('latest', () => {
      const toggleNode = $getRoot().getFirstChildOrThrow();
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
      key: toggleRowKey,
      top: 10,
      bottom: 34,
      unitBottom: 90,
      left: 16,
      marginBottom: 4,
    });
  });

  it('leaves out the blocks of a collapsed toggle’s body', () => {
    const editor = makeEditor(() => [
      toggle('shut', [paragraph('hidden')], true),
      paragraph('after'),
    ]);

    expect(rowTexts(editor)).toEqual(['shut', 'after']);
  });

  it('makes a table one row and a list one row without a handle, never entering their cells or items', () => {
    const editor = makeEditor(() => {
      const list = $createListNode('bullet').append(
        $createListItemNode().append($createTextNode('item')),
      );
      return [
        $createTableNodeWithDimensions(2, 2, false),
        list,
        toggle('head', [
          $createListNode('number').append(
            $createListItemNode().append($createTextNode('nested item')),
          ),
        ]),
      ];
    });

    const rows = collectBlockRows(editor);

    expect(rows).toHaveLength(4);
    expect(rows.map(({ hasHandle }) => hasHandle)).toEqual([
      true,
      false,
      true,
      false,
    ]);
  });
});
