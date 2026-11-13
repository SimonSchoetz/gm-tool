// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { buildNestedBlocksState } from '../nestedBlocksState';

type SavedNode = {
  type: string;
  children?: SavedNode[];
  text?: string;
  listType?: string;
  indent?: number;
  checked?: boolean;
  value?: number;
  collapsed?: boolean;
  version?: number;
  tag?: string;
  format?: number | string;
};

const rootChildren = (): SavedNode[] => {
  const state = JSON.parse(buildNestedBlocksState()) as {
    root: SavedNode;
  };
  return state.root.children ?? [];
};

const textOf = (node: SavedNode): string =>
  (node.children ?? []).map((child) => child.text ?? '').join('');

const blockAt = (index: number): SavedNode => {
  const block = rootChildren().at(index) ?? null;
  if (block === null) throw new Error(`No root block at ${index}`);
  return block;
};

// The real items in document order; a nesting wrapper (an item whose only child is a list) contributes only its sub-list's items.
const realItemsOf = (list: SavedNode): SavedNode[] =>
  (list.children ?? []).flatMap((item) => {
    const subList = item.children?.find(({ type }) => type === 'list') ?? null;
    return subList === null ? [item] : realItemsOf(subList);
  });

// Each real item as `<depth> <text>`.
const itemsOf = (list: SavedNode): string[] =>
  realItemsOf(list).map((item) => `${item.indent} ${textOf(item)}`);

describe('buildNestedBlocksState', () => {
  it('holds a bullet list, a numbered list, a check list, an open toggle, a collapsed toggle, a heading, two paragraphs and three more toggles, in that order', () => {
    expect(rootChildren().map((block) => block.type)).toEqual([
      'list',
      'list',
      'list',
      'toggle',
      'toggle',
      'heading',
      'paragraph',
      'paragraph',
      'toggle',
      'toggle',
      'toggle',
    ]);
    expect(
      rootChildren()
        .slice(0, 3)
        .map((list) => list.listType),
    ).toEqual(['bullet', 'number', 'check']);
  });

  it('nests the bullet and the numbered list down to depth 2, each item saved with its depth as its indent', () => {
    expect(itemsOf(blockAt(0))).toEqual([
      '0 Bullet one',
      '1 Bullet one-a',
      '2 Bullet one-a-i',
      '1 Bullet one-b',
      '0 Bullet two',
    ]);
    expect(itemsOf(blockAt(1))).toEqual([
      '0 Number one',
      '1 Number one-a',
      '2 Number one-a-i',
      '1 Number one-b',
      '0 Number two',
    ]);
  });

  it('puts each sub-list inside a nesting wrapper that follows its parent item, as Lexical saves a nested list', () => {
    const topLevel = blockAt(0).children ?? [];

    expect(topLevel.map((item) => item.children?.[0]?.type)).toEqual([
      'text',
      'list',
      'text',
    ]);
    expect(topLevel[1].indent).toBe(0);
    const nested = topLevel[1].children?.[0].children ?? [];
    expect(nested.map((item) => item.children?.[0]?.type)).toEqual([
      'text',
      'list',
      'text',
    ]);
    expect(nested[1].indent).toBe(1);
  });

  it('gives the check list one checked item among unchecked ones down to depth 2, and no other list a checked value', () => {
    const checkList = blockAt(2);

    expect(itemsOf(checkList)).toEqual([
      '0 Check open item',
      '0 Check done item',
      '1 Check nested item',
      '2 Check deepest item',
    ]);
    expect((checkList.children ?? []).map(({ checked }) => checked)).toEqual([
      false,
      true,
      false,
    ]);
    expect(realItemsOf(checkList).map(({ checked }) => checked)).toEqual([
      false,
      true,
      false,
      false,
    ]);
    expect(
      [blockAt(0), blockAt(1)]
        .flatMap(realItemsOf)
        .every((item) => item.checked === undefined),
    ).toBe(true);
  });

  it('numbers each real item by its position among the real items of its list, and gives a nesting wrapper the number the next real item takes', () => {
    const numbered = blockAt(1).children ?? [];

    expect(numbered.map(({ value }) => value)).toEqual([1, 2, 2]);
    expect(
      numbered[1].children?.[0].children?.map(({ value }) => value),
    ).toEqual([1, 2, 2]);
  });

  it('holds an open toggle with a header and three body paragraphs, and a collapsed toggle with a header and one', () => {
    const [openHeader, openBody] = blockAt(3).children ?? [];
    const [collapsedHeader, collapsedBody] = blockAt(4).children ?? [];

    expect(blockAt(3).collapsed).toBe(false);
    expect(textOf(openHeader)).toBe('Open toggle');
    expect(openBody.type).toBe('toggle-body');
    expect(openBody.children?.map(textOf)).toEqual([
      'Open toggle body one',
      'Open toggle body two',
      'Open toggle body three',
    ]);
    expect(blockAt(4).collapsed).toBe(true);
    expect(textOf(collapsedHeader)).toBe('Collapsed toggle');
    expect(collapsedBody.children?.map(textOf)).toEqual([
      'Collapsed toggle body',
    ]);
  });

  it('holds a toggle whose header is one paragraph ending in a bold run after a plain one', () => {
    const [header, body] = blockAt(8).children ?? [];

    expect(blockAt(8).collapsed).toBe(false);
    expect(header.type).toBe('paragraph');
    expect(header.children?.map(({ text }) => text)).toEqual([
      'Toggle ending in ',
      'bold text',
    ]);
    expect(header.children?.map(({ format }) => format)).toEqual([0, 1]);
    expect(body.children?.map(textOf)).toEqual(['Bold-ending toggle body']);
  });

  it('holds a toggle whose header is a level-two heading', () => {
    const [header, body] = blockAt(9).children ?? [];

    expect(header.type).toBe('heading');
    expect(header.tag).toBe('h2');
    expect(textOf(header)).toBe('Heading toggle');
    expect(body.children?.map(textOf)).toEqual(['Heading toggle body']);
  });

  it('holds a toggle saved with an extra paragraph between its header and its body', () => {
    const children = blockAt(10).children ?? [];

    expect(children.map(({ type }) => type)).toEqual([
      'paragraph',
      'paragraph',
      'toggle-body',
    ]);
    expect(children.slice(0, 2).map(textOf)).toEqual([
      'Extra block toggle',
      'Extra block between header and body',
    ]);
    expect(children[2].children?.map(textOf)).toEqual([
      'Extra block toggle body',
    ]);
  });

  it('returns the text of an editor-state root, as the text editor saves it', () => {
    const state = JSON.parse(buildNestedBlocksState()) as { root: SavedNode };

    expect(state.root.type).toBe('root');
    expect(state.root.version).toBe(1);
  });
});
