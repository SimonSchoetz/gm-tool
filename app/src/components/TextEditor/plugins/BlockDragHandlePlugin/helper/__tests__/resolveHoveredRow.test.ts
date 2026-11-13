import { describe, expect, it } from 'vitest';
import type { BlockRow } from '../collectBlockRows';
import { resolveHoveredRow } from '../resolveHoveredRow';

// Three rows with a 4-unit gap between each pair; the gap between the first two has its middle at 22.
const rows: BlockRow[] = [
  {
    key: 'a',
    element: document.createElement('div'),
    top: 0,
    bottom: 20,
    marginTop: 0,
    marginBottom: 4,
  },
  {
    key: 'b',
    element: document.createElement('div'),
    top: 24,
    bottom: 44,
    marginTop: 0,
    marginBottom: 4,
  },
  {
    key: 'c',
    element: document.createElement('div'),
    top: 48,
    bottom: 68,
    marginTop: 0,
    marginBottom: 4,
  },
];

describe('resolveHoveredRow', () => {
  it('resolves the row whose vertical extent holds the pointer', () => {
    expect(resolveHoveredRow(rows, 10)?.key).toBe('a');
    expect(resolveHoveredRow(rows, 30)?.key).toBe('b');
    expect(resolveHoveredRow(rows, 60)?.key).toBe('c');
  });

  it('gives the pointer in the gap between two rows to the row whose half of the gap it is in', () => {
    expect(resolveHoveredRow(rows, 21)?.key).toBe('a');
    expect(resolveHoveredRow(rows, 23)?.key).toBe('b');
    expect(resolveHoveredRow(rows, 45)?.key).toBe('b');
    expect(resolveHoveredRow(rows, 47)?.key).toBe('c');
  });

  it('resolves a pointer exactly on a row edge or on the middle of a gap to a row', () => {
    expect(resolveHoveredRow(rows, 0)?.key).toBe('a');
    expect(resolveHoveredRow(rows, 22)?.key).toBe('a');
    expect(resolveHoveredRow(rows, 68)?.key).toBe('c');
  });

  it('resolves no row for a pointer above the first row or below the last', () => {
    expect(resolveHoveredRow(rows, -1)).toBeNull();
    expect(resolveHoveredRow(rows, 69)).toBeNull();
  });

  it('resolves no row when there are no rows', () => {
    expect(resolveHoveredRow([], 10)).toBeNull();
  });
});
