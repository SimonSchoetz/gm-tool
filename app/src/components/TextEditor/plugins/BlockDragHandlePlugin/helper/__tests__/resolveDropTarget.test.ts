import { describe, expect, it } from 'vitest';
import type { BlockRow } from '../collectBlockRows';
import { resolveDropTarget } from '../resolveDropTarget';

const row = (
  key: string,
  geometry: Pick<BlockRow, 'top' | 'bottom'> &
    Partial<
      Pick<
        BlockRow,
        'unitBottom' | 'left' | 'marginTop' | 'marginBottom' | 'ancestry'
      >
    >,
): BlockRow => ({
  key,
  element: document.createElement('div'),
  unitBottom: geometry.bottom,
  left: 16,
  marginTop: 0,
  marginBottom: 6,
  ancestry: [],
  hasHandle: true,
  ...geometry,
});

// A document of: paragraph "first", an open toggle "toggle" with a two-paragraph body "x" and "y", paragraph "after" and a collapsed toggle "shut". The gaps are 4 units; the margins differ from the gaps so a line placed from a margin is told from one placed from a neighbour. A body's blocks are indented 32 units from the toggle's own edge.
const first = row('first', { top: 0, bottom: 20, marginTop: 6 });
const toggle = row('toggle', { top: 24, bottom: 44, unitBottom: 94 });
const x = row('x', { top: 48, bottom: 68, left: 48, ancestry: ['toggle'] });
const y = row('y', { top: 70, bottom: 90, left: 48, ancestry: ['toggle'] });
const after = row('after', { top: 104, bottom: 124, marginTop: 3 });
const shut = row('shut', { top: 128, bottom: 148, marginBottom: 8 });
const rows = [first, toggle, x, y, after, shut];

// A toggle "outer" whose open body holds one toggle "inner", whose body holds one paragraph "deep"; all three end the container they are in.
const outer = row('outer', { top: 0, bottom: 20, unitBottom: 110 });
const inner = row('inner', {
  top: 24,
  bottom: 44,
  unitBottom: 100,
  left: 48,
  ancestry: ['outer'],
});
const deep = row('deep', {
  top: 48,
  bottom: 68,
  left: 80,
  ancestry: ['outer', 'inner'],
});
const nestedRows = [outer, inner, deep];

describe('resolveDropTarget', () => {
  it('chooses the gap before a row for a pointer in its upper half, the line half the row’s top margin above its top', () => {
    expect(resolveDropTarget(rows, 'none', 100, 108)).toEqual({
      row: after,
      beside: after,
      placement: 'before',
      gap: { row: after, margin: 'marginTop' },
      lineTop: after.top - after.marginTop / 2,
      lineLeft: after.left,
    });
  });

  it('chooses the gap after a row for a pointer in its lower half, the line half the row’s bottom margin below its unit', () => {
    expect(resolveDropTarget(rows, 'none', 100, 120)).toEqual({
      row: after,
      beside: after,
      placement: 'after',
      gap: { row: after, margin: 'marginBottom' },
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
      placement: 'after',
    });
    expect(resolveDropTarget(rows, 'none', 100, 23)).toMatchObject({
      row: toggle,
      placement: 'before',
    });
  });

  it('chooses the gap before the first row for a pointer above it, and the gap after the last row for a pointer below it', () => {
    expect(resolveDropTarget(rows, 'none', 100, -20)).toMatchObject({
      row: first,
      placement: 'before',
      lineTop: first.top - first.marginTop / 2,
    });
    expect(resolveDropTarget(rows, 'none', 100, 200)).toMatchObject({
      row: shut,
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
      beside: x,
      placement: 'before',
      gap: { row: x, margin: 'marginTop' },
      lineTop: x.top - x.marginTop / 2,
      lineLeft: x.left,
    });
  });

  it('places a drop on the lower half of a collapsed toggle after the toggle, the line at the toggle’s bottom', () => {
    expect(resolveDropTarget(rows, 'none', 20, 145)).toMatchObject({
      row: shut,
      beside: shut,
      placement: 'after',
      lineTop: shut.unitBottom + shut.marginBottom / 2,
    });
  });

  it('keeps a drop on the lower half of the last body block inside the body while the pointer is at or right of the block’s left edge', () => {
    expect(resolveDropTarget(rows, 'none', y.left, 86)).toMatchObject({
      beside: y,
      placement: 'after',
      lineLeft: y.left,
    });
    expect(resolveDropTarget(rows, 'none', y.left + 100, 86)).toMatchObject({
      beside: y,
    });
  });

  it('places a drop on the lower half of the last body block after the toggle when the pointer is left of the block’s left edge', () => {
    expect(resolveDropTarget(rows, 'none', y.left - 1, 86)).toEqual({
      row: y,
      beside: toggle,
      placement: 'after',
      gap: { row: toggle, margin: 'marginBottom' },
      lineTop: toggle.unitBottom + toggle.marginBottom / 2,
      lineLeft: toggle.left,
    });
  });

  it('never leaves the body from a block that is not its last, whatever the pointer’s horizontal position', () => {
    expect(resolveDropTarget(rows, 'none', 0, 64)).toMatchObject({
      beside: x,
      placement: 'after',
    });
  });

  it('leaves one toggle at a time, each time the pointer is left of the left edge of the row it is currently placed after', () => {
    const deepLowerHalf = 64;

    expect(
      resolveDropTarget(nestedRows, 'none', deep.left, deepLowerHalf),
    ).toMatchObject({ beside: deep });
    expect(
      resolveDropTarget(nestedRows, 'none', deep.left - 1, deepLowerHalf),
    ).toMatchObject({ beside: inner, placement: 'after' });
    expect(
      resolveDropTarget(nestedRows, 'none', inner.left - 1, deepLowerHalf),
    ).toMatchObject({ beside: outer, placement: 'after' });
    expect(
      resolveDropTarget(nestedRows, 'none', 0, deepLowerHalf),
    ).toMatchObject({
      beside: outer,
    });
  });

  it('stays in the body of the outer toggle when the inner toggle is not the last block of it', () => {
    const innerSibling = row('sibling', {
      top: 104,
      bottom: 124,
      left: 48,
      ancestry: ['outer'],
    });

    expect(
      resolveDropTarget([outer, inner, deep, innerSibling], 'none', 0, 64),
    ).toMatchObject({ beside: inner });
  });

  it('offers a dragged toggle no position on a row inside its own body, and none on the lower half of its own open header', () => {
    expect(resolveDropTarget(rows, 'toggle', 100, 58)).toBeNull();
    expect(resolveDropTarget(rows, 'toggle', 100, 86)).toBeNull();
    expect(resolveDropTarget(rows, 'toggle', 100, 40)).toBeNull();
  });

  it('still offers a dragged toggle the positions beside itself and its neighbours', () => {
    expect(resolveDropTarget(rows, 'toggle', 100, 28)).toMatchObject({
      beside: toggle,
      placement: 'before',
    });
    expect(resolveDropTarget(rows, 'toggle', 100, 110)).toMatchObject({
      beside: after,
      placement: 'before',
    });
  });

  it('offers a dragged body block the positions beside itself and may leave its body', () => {
    expect(resolveDropTarget(rows, 'y', y.left - 1, 86)).toMatchObject({
      beside: toggle,
      placement: 'after',
    });
    expect(resolveDropTarget(rows, 'y', y.left, 74)).toMatchObject({
      beside: y,
      placement: 'before',
    });
  });
});
