import { describe, expect, it } from 'vitest';
import type { BlockRow } from '../collectBlockRows';
import { resolveDropTarget } from '../resolveDropTarget';

// Three rows, 4 units apart; the first has a top margin and the last a bottom margin, which are the gaps at the ends of the document.
const [a, b, c]: BlockRow[] = [
  {
    key: 'a',
    element: document.createElement('div'),
    top: 0,
    bottom: 20,
    marginTop: 6,
    marginBottom: 6,
  },
  {
    key: 'b',
    element: document.createElement('div'),
    top: 24,
    bottom: 44,
    marginTop: 0,
    marginBottom: 6,
  },
  {
    key: 'c',
    element: document.createElement('div'),
    top: 48,
    bottom: 68,
    marginTop: 0,
    marginBottom: 8,
  },
];
const rows = [a, b, c];

describe('resolveDropTarget', () => {
  it('chooses the gap before a row for a pointer in its upper half, with the row above opening the gap', () => {
    expect(resolveDropTarget(rows, 28)).toEqual({
      row: b,
      placement: 'before',
      gap: { row: a, margin: 'marginBottom' },
      lineTop: (a.bottom + b.top) / 2,
    });
  });

  it('chooses the gap after a row for a pointer in its lower half, with the row itself opening the gap', () => {
    expect(resolveDropTarget(rows, 40)).toEqual({
      row: b,
      placement: 'after',
      gap: { row: b, margin: 'marginBottom' },
      lineTop: (b.bottom + c.top) / 2,
    });
  });

  it('chooses the gap after a row for a pointer exactly at its middle', () => {
    expect(resolveDropTarget(rows, (b.top + b.bottom) / 2)?.placement).toBe(
      'after',
    );
  });

  it('puts a pointer in the gap between two rows on that gap whichever row it is nearer', () => {
    const nearAbove = resolveDropTarget(rows, 21);
    const nearBelow = resolveDropTarget(rows, 23);

    expect(nearAbove).toMatchObject({ row: a, placement: 'after' });
    expect(nearBelow).toMatchObject({ row: b, placement: 'before' });
    expect(nearAbove?.lineTop).toBe(nearBelow?.lineTop);
    expect(nearAbove?.gap).toEqual(nearBelow?.gap);
  });

  it('chooses the gap before the first row for a pointer above it, the line half its top margin above its top', () => {
    expect(resolveDropTarget(rows, -20)).toEqual({
      row: a,
      placement: 'before',
      gap: { row: a, margin: 'marginTop' },
      lineTop: a.top - a.marginTop / 2,
    });
  });

  it('chooses the gap after the last row for a pointer below it, the line half its bottom margin below its bottom', () => {
    expect(resolveDropTarget(rows, 90)).toEqual({
      row: c,
      placement: 'after',
      gap: { row: c, margin: 'marginBottom' },
      lineTop: c.bottom + c.marginBottom / 2,
    });
  });

  it('chooses no target when there are no rows', () => {
    expect(resolveDropTarget([], 10)).toBeNull();
  });
});
