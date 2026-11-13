import { describe, expect, it } from 'vitest';
import { resolveDropTarget } from '../resolveDropTarget';
import { makeItemRow, makeRow } from './support/blockRows';

// A document of: paragraph "first", an open toggle "toggle" with a two-paragraph body "x" and "y", paragraph "after" and a collapsed toggle "shut". The gaps are 4 units; the margins differ from the gaps so a line placed from a margin is told from one placed from a neighbour. A body's blocks are indented 32 units from the toggle's own edge.
const first = makeRow('first', { top: 0, bottom: 20, marginTop: 6 });
const toggle = makeRow('toggle', { top: 24, bottom: 44, unitBottom: 94 });
const x = makeRow('x', {
  top: 48,
  bottom: 68,
  left: 48,
  ancestry: ['toggle'],
});
const y = makeRow('y', {
  top: 70,
  bottom: 90,
  left: 48,
  ancestry: ['toggle'],
});
const after = makeRow('after', { top: 104, bottom: 124, marginTop: 3 });
const shut = makeRow('shut', { top: 128, bottom: 148, marginBottom: 8 });
const rows = [first, toggle, x, y, after, shut];

// A toggle "outer" whose open body holds one toggle "inner", whose body holds one paragraph "deep"; all three end the container they are in.
const outer = makeRow('outer', { top: 0, bottom: 20, unitBottom: 110 });
const inner = makeRow('inner', {
  top: 24,
  bottom: 44,
  unitBottom: 100,
  left: 48,
  ancestry: ['outer'],
});
const deep = makeRow('deep', {
  top: 48,
  bottom: 68,
  left: 80,
  ancestry: ['outer', 'inner'],
});
const nestedRows = [outer, inner, deep];

// A bullet list "L1" of A (depth 0) with sub-item A1 (depth 1) with sub-item A1i (depth 2), then B (depth 0); then a numbered list "L2" of N; then a paragraph "P". The text of an item sits 24 units right of its parent's.
const itemA = makeItemRow(
  'A',
  { top: 0, bottom: 20, unitBottom: 68 },
  { depth: 0, rootKey: 'L1' },
);
const itemA1 = makeItemRow(
  'A1',
  { top: 24, bottom: 44, unitBottom: 68 },
  { depth: 1, rootKey: 'L1', parents: ['A'] },
);
const itemA1i = makeItemRow(
  'A1i',
  { top: 48, bottom: 68 },
  { depth: 2, rootKey: 'L1', parents: ['A', 'A1'] },
);
const itemB = makeItemRow(
  'B',
  { top: 72, bottom: 92 },
  { depth: 0, rootKey: 'L1' },
);
const itemN = makeItemRow(
  'N',
  { top: 96, bottom: 116 },
  { depth: 0, rootKey: 'L2' },
);
const paragraphP = makeRow('P', { top: 120, bottom: 140 });
// The paragraph being dragged in the tests that drop into lists: it may join a list.
const dragged = makeRow('D', { top: 300, bottom: 320 });
const listRows = [itemA, itemA1, itemA1i, itemB, itemN, paragraphP, dragged];
const listOnly = [itemA, itemA1, itemA1i, itemB, paragraphP, dragged];

describe('resolveDropTarget', () => {
  it('chooses the gap before a row for a pointer in its upper half, the line half the row’s top margin above its top', () => {
    expect(resolveDropTarget(rows, 'none', 100, 108)).toEqual({
      row: after,
      besideKey: 'after',
      placement: 'before',
      depth: null,
      gap: { element: after.element, margin: 'marginTop' },
      lineTop: after.top - after.marginTop / 2,
      lineLeft: after.left,
    });
  });

  it('chooses the gap after a row for a pointer in its lower half, the line half the row’s bottom margin below its unit', () => {
    expect(resolveDropTarget(rows, 'none', 100, 120)).toEqual({
      row: after,
      besideKey: 'after',
      placement: 'after',
      depth: null,
      gap: { element: after.endElement, margin: 'marginBottom' },
      lineTop: after.unitBottom + after.marginBottom / 2,
      lineLeft: after.left,
    });
  });

  it('chooses the gap after a row for a pointer exactly at its middle', () => {
    expect(
      resolveDropTarget(rows, 'none', 100, (after.top + after.bottom) / 2)
        ?.placement,
    ).toBe('after');
  });

  it('gives a pointer in the gap between two rows to the nearer row and then its half', () => {
    expect(resolveDropTarget(rows, 'none', 100, 21)).toMatchObject({
      row: first,
      besideKey: 'first',
      placement: 'after',
    });
    expect(resolveDropTarget(rows, 'none', 100, 23)).toMatchObject({
      row: toggle,
      besideKey: 'toggle',
      placement: 'before',
    });
  });

  it('chooses the gap before the first row for a pointer above it, and the gap after the last row for a pointer below it', () => {
    expect(resolveDropTarget(rows, 'none', 100, -20)).toMatchObject({
      besideKey: 'first',
      placement: 'before',
      lineTop: first.top - first.marginTop / 2,
    });
    expect(resolveDropTarget(rows, 'none', 100, 200)).toMatchObject({
      besideKey: 'shut',
      placement: 'after',
      lineTop: shut.unitBottom + shut.marginBottom / 2,
    });
  });

  it('chooses no target when there are no rows', () => {
    expect(resolveDropTarget([], 'none', 100, 10)).toBeNull();
  });

  it('places a drop on the lower half of an open toggle’s header before the first row of its body, the line at the body’s left edge', () => {
    expect(resolveDropTarget(rows, 'none', 20, 40)).toEqual({
      row: toggle,
      besideKey: 'x',
      placement: 'before',
      depth: null,
      gap: { element: x.element, margin: 'marginTop' },
      lineTop: x.top - x.marginTop / 2,
      lineLeft: x.left,
    });
  });

  it('places a drop on the lower half of a collapsed toggle after the toggle, the line at the toggle’s bottom', () => {
    expect(resolveDropTarget(rows, 'none', 20, 145)).toMatchObject({
      row: shut,
      besideKey: 'shut',
      placement: 'after',
      lineTop: shut.unitBottom + shut.marginBottom / 2,
    });
  });

  it('keeps a drop on the lower half of the last body block inside the body while the pointer is at or right of the block’s left edge', () => {
    expect(resolveDropTarget(rows, 'none', y.left, 86)).toMatchObject({
      besideKey: 'y',
      placement: 'after',
      lineLeft: y.left,
    });
    expect(resolveDropTarget(rows, 'none', y.left + 100, 86)).toMatchObject({
      besideKey: 'y',
    });
  });

  it('places a drop on the lower half of the last body block after the toggle when the pointer is left of the block’s left edge', () => {
    expect(resolveDropTarget(rows, 'none', y.left - 1, 86)).toEqual({
      row: y,
      besideKey: 'toggle',
      placement: 'after',
      depth: null,
      gap: { element: toggle.endElement, margin: 'marginBottom' },
      lineTop: toggle.unitBottom + toggle.marginBottom / 2,
      lineLeft: toggle.left,
    });
  });

  it('never leaves the body from a block that is not its last, whatever the pointer’s horizontal position', () => {
    expect(resolveDropTarget(rows, 'none', 0, 64)).toMatchObject({
      besideKey: 'x',
      placement: 'after',
    });
  });

  it('leaves one toggle at a time, each time the pointer is left of the left edge of the row it is currently placed after', () => {
    const deepLowerHalf = 64;

    expect(
      resolveDropTarget(nestedRows, 'none', deep.left, deepLowerHalf),
    ).toMatchObject({ besideKey: 'deep' });
    expect(
      resolveDropTarget(nestedRows, 'none', deep.left - 1, deepLowerHalf),
    ).toMatchObject({ besideKey: 'inner', placement: 'after' });
    expect(
      resolveDropTarget(nestedRows, 'none', inner.left - 1, deepLowerHalf),
    ).toMatchObject({ besideKey: 'outer', placement: 'after' });
    expect(
      resolveDropTarget(nestedRows, 'none', 0, deepLowerHalf),
    ).toMatchObject({ besideKey: 'outer' });
  });

  it('stays in the body of the outer toggle when the inner toggle is not the last block of it', () => {
    const innerSibling = makeRow('sibling', {
      top: 104,
      bottom: 124,
      left: 48,
      ancestry: ['outer'],
    });

    expect(
      resolveDropTarget([outer, inner, deep, innerSibling], 'none', 0, 64),
    ).toMatchObject({ besideKey: 'inner' });
  });

  it('offers a dragged toggle no position on a row inside its own body, and none on the lower half of its own open header', () => {
    expect(resolveDropTarget(rows, 'toggle', 100, 58)).toBeNull();
    expect(resolveDropTarget(rows, 'toggle', 100, 86)).toBeNull();
    expect(resolveDropTarget(rows, 'toggle', 100, 40)).toBeNull();
  });

  it('still offers a dragged toggle the positions beside itself and its neighbours', () => {
    expect(resolveDropTarget(rows, 'toggle', 100, 28)).toMatchObject({
      besideKey: 'toggle',
      placement: 'before',
    });
    expect(resolveDropTarget(rows, 'toggle', 100, 110)).toMatchObject({
      besideKey: 'after',
      placement: 'before',
    });
  });

  it('offers a dragged body block the positions beside itself and may leave its body', () => {
    expect(resolveDropTarget(rows, 'y', y.left - 1, 86)).toMatchObject({
      besideKey: 'toggle',
      placement: 'after',
    });
    expect(resolveDropTarget(rows, 'y', y.left, 74)).toMatchObject({
      besideKey: 'y',
      placement: 'before',
    });
  });

  it('chooses the depth of a drop below the deepest item by the pointer’s position: the item’s first child, the item, its parent or its grandparent, each at or right of that item’s text edge', () => {
    const lowerHalfOfDeepest = 64;
    const at = (clientX: number) =>
      resolveDropTarget(listOnly, 'D', clientX, lowerHalfOfDeepest);

    expect(at(itemA1i.left + 24)).toMatchObject({
      besideKey: 'A1i',
      placement: 'after',
      depth: 3,
      lineLeft: itemA1i.left + 24,
    });
    expect(at(itemA1i.left)).toMatchObject({
      besideKey: 'A1i',
      depth: 2,
      lineLeft: itemA1i.left,
    });
    expect(at(itemA1.left)).toMatchObject({ besideKey: 'A1', depth: 1 });
    expect(at(itemA.left)).toMatchObject({ besideKey: 'A', depth: 0 });
    expect(at(0)).toMatchObject({ besideKey: 'A', depth: 0 });
  });

  it('offers a drop between two items of one list no depth below the next item’s or above the item’s above plus one', () => {
    const upperHalfOfB = 76;

    expect(resolveDropTarget(listOnly, 'D', 400, upperHalfOfB)).toMatchObject({
      depth: 3,
    });
    expect(resolveDropTarget(listOnly, 'D', 0, upperHalfOfB)).toMatchObject({
      besideKey: 'A',
      depth: 0,
    });
  });

  it('offers only the position before the first sub-item below an item that has sub-items', () => {
    const lowerHalfOfA = 16;

    expect(resolveDropTarget(listOnly, 'D', 400, lowerHalfOfA)).toMatchObject({
      besideKey: 'A1',
      placement: 'before',
      depth: 1,
    });
    expect(resolveDropTarget(listOnly, 'D', 0, lowerHalfOfA)).toMatchObject({
      besideKey: 'A1',
      depth: 1,
    });
  });

  it('offers the position after the list below its last item when the pointer is left of the depth-0 text edge, and the item’s own positions otherwise', () => {
    const lowerHalfOfB = 88;

    expect(
      resolveDropTarget(listOnly, 'D', itemB.left - 1, lowerHalfOfB),
    ).toEqual({
      row: itemB,
      besideKey: 'L1',
      placement: 'after',
      depth: null,
      gap: { element: itemB.list?.rootElement, margin: 'marginBottom' },
      lineTop: itemB.unitBottom + (itemB.list?.rootMarginBottom ?? 0) / 2,
      lineLeft: itemB.left - (itemB.list?.step ?? 0),
    });
    expect(
      resolveDropTarget(listOnly, 'D', itemB.left, lowerHalfOfB),
    ).toMatchObject({
      besideKey: 'B',
      depth: 0,
    });
    expect(
      resolveDropTarget(listOnly, 'D', itemB.left + 24, lowerHalfOfB),
    ).toMatchObject({ besideKey: 'B', depth: 1 });
  });

  it('offers the position before the first item of a list, inside the list or before the whole list by the pointer’s position', () => {
    const upperHalfOfA = 4;

    expect(
      resolveDropTarget(listOnly, 'D', itemA.left, upperHalfOfA),
    ).toMatchObject({
      besideKey: 'A',
      placement: 'before',
      depth: 0,
      lineLeft: itemA.left,
    });
    expect(
      resolveDropTarget(listOnly, 'D', itemA.left - 1, upperHalfOfA),
    ).toEqual({
      row: itemA,
      besideKey: 'L1',
      placement: 'before',
      depth: null,
      gap: { element: itemA.list?.rootElement, margin: 'marginTop' },
      lineTop: itemA.top - (itemA.list?.rootMarginTop ?? 0) / 2,
      lineLeft: itemA.left - (itemA.list?.step ?? 0),
    });
  });

  it('chooses between two lists by the half of the pointer: the upper list from the lower half of its last item, the lower list from the upper half of its first', () => {
    const lowerHalfOfB = 88;
    const upperHalfOfN = 100;

    expect(
      resolveDropTarget(listRows, 'D', itemB.left, lowerHalfOfB),
    ).toMatchObject({ besideKey: 'B', depth: 0 });
    expect(
      resolveDropTarget(listRows, 'D', itemN.left, upperHalfOfN),
    ).toMatchObject({ besideKey: 'N', placement: 'before', depth: 0 });
    expect(
      resolveDropTarget(listRows, 'D', itemB.left - 1, lowerHalfOfB),
    ).toMatchObject({ besideKey: 'L1', placement: 'after', depth: null });
    expect(
      resolveDropTarget(listRows, 'D', itemN.left - 1, upperHalfOfN),
    ).toMatchObject({ besideKey: 'L2', placement: 'before', depth: null });
  });

  it('offers a dragged block that may not join a list only positions outside every list', () => {
    const heading = makeRow('H', { top: 150, bottom: 170, canJoinList: false });
    const rowsWithHeading = [...listOnly, heading];

    expect(resolveDropTarget(rowsWithHeading, 'H', 400, 40)).toBeNull();
    expect(resolveDropTarget(rowsWithHeading, 'H', 400, 88)).toMatchObject({
      besideKey: 'L1',
      placement: 'after',
      depth: null,
    });
    expect(resolveDropTarget(rowsWithHeading, 'H', 400, 4)).toMatchObject({
      besideKey: 'L1',
      placement: 'before',
      depth: null,
    });
  });

  it('offers a dragged item no position inside its own sub-items, and no position as its own first child', () => {
    expect(resolveDropTarget(listOnly, 'A', 400, 30)).toBeNull();
    expect(resolveDropTarget(listOnly, 'A', 400, 16)).toBeNull();
    expect(resolveDropTarget(listOnly, 'A1i', 400, 64)).toMatchObject({
      besideKey: 'A1i',
      depth: 2,
    });
  });

  it('offers the position after the list below the last item of a list even from a deep item, and below a list that ends a toggle body: the list’s own edge between the item’s and the toggle’s', () => {
    const deepLast = makeItemRow(
      'D1',
      { top: 24, bottom: 44 },
      { depth: 1, rootKey: 'L9', parents: ['D0'] },
      ['T9'],
    );
    const top = makeItemRow(
      'D0',
      { top: 0, bottom: 20, unitBottom: 44 },
      { depth: 0, rootKey: 'L9' },
      ['T9'],
    );
    const host = makeRow('T9', {
      top: -30,
      bottom: -10,
      unitBottom: 44,
      left: 0,
    });
    const outside = makeRow('O', { top: 60, bottom: 80 });
    const paragraphD = makeRow('D', { top: 200, bottom: 220 });
    const all = [host, top, deepLast, outside, paragraphD];
    const lowerHalfOfDeepLast = 40;

    expect(
      resolveDropTarget(all, 'D', top.left - 1, lowerHalfOfDeepLast),
    ).toMatchObject({
      besideKey: 'L9',
      placement: 'after',
      depth: null,
      lineLeft: top.left - 24,
    });
    expect(
      resolveDropTarget(all, 'D', host.left - 1, lowerHalfOfDeepLast),
    ).toMatchObject({ besideKey: 'T9', placement: 'after' });
  });

  it('offers the position before the first item of a list from the lower half of a paragraph above it, inside the list at or right of the item’s text and after the paragraph otherwise', () => {
    const above = makeRow('Q', { top: 0, bottom: 20 });
    const item = makeItemRow(
      'I',
      { top: 24, bottom: 44 },
      { depth: 0, rootKey: 'L7' },
    );
    const draggedRow = makeRow('D', { top: 100, bottom: 120 });
    const all = [above, item, draggedRow];
    const lowerHalfOfQ = 16;

    expect(resolveDropTarget(all, 'D', item.left, lowerHalfOfQ)).toMatchObject({
      besideKey: 'I',
      placement: 'before',
      depth: 0,
    });
    expect(
      resolveDropTarget(all, 'D', item.left - 1, lowerHalfOfQ),
    ).toMatchObject({ besideKey: 'Q', placement: 'after', depth: null });
  });

  it('offers only the position before a row that is not a list item from the upper half of that row, whatever the row above is', () => {
    expect(resolveDropTarget(listOnly, 'D', 400, 124)).toMatchObject({
      besideKey: 'P',
      placement: 'before',
      depth: null,
    });
    expect(resolveDropTarget(listOnly, 'D', 0, 124)).toMatchObject({
      besideKey: 'P',
      placement: 'before',
    });
  });

  it('offers the first item of a list the position before the item and before the list from its upper half, with no row above it', () => {
    const singleList = [itemA, itemA1, itemB];

    expect(resolveDropTarget(singleList, 'B', itemA.left, 4)).toMatchObject({
      besideKey: 'A',
      placement: 'before',
      depth: 0,
    });
    expect(resolveDropTarget(singleList, 'B', itemA.left - 1, 4)).toMatchObject(
      {
        besideKey: 'L1',
        placement: 'before',
        depth: null,
      },
    );
  });

  it('offers no position inside a list to a dragged block that is not among the rows', () => {
    expect(resolveDropTarget(listOnly, 'missing', 400, 76)).toBeNull();
  });
});
