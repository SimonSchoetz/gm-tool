import { renderHook } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useSortable, type SortState } from '../useSortable';

type Row = { id: string; name: string | null; rank: number };

const ROWS: Row[] = [
  { id: 'b', name: 'Bravo', rank: 2 },
  { id: 'c', name: null, rank: 3 },
  { id: 'a', name: 'Alpha', rank: 1 },
];

const renderSorted = (
  sortState: SortState<Row>,
  columns: Parameters<typeof useSortable<Row>>[1]['columns'] = [],
  items: Row[] = ROWS,
) =>
  renderHook(() => useSortable(items, { sortState, columns })).result.current;

describe('useSortable', () => {
  it('sorts strings ascending by the sort column', () => {
    const sorted = renderSorted({ column: 'name', direction: 'asc' });

    expect(sorted.map((row) => row.id)).toEqual(['a', 'b', 'c']);
  });

  it('reverses the order for a descending sort, keeping the empty value last', () => {
    const sorted = renderSorted({ column: 'name', direction: 'desc' });

    expect(sorted.map((row) => row.id)).toEqual(['c', 'b', 'a']);
  });

  it('sorts numbers by value, not by their string form', () => {
    const rows: Row[] = [
      { id: 'ten', name: 'x', rank: 10 },
      { id: 'two', name: 'x', rank: 2 },
    ];

    const sorted = renderSorted({ column: 'rank', direction: 'asc' }, [], rows);

    expect(sorted.map((row) => row.id)).toEqual(['two', 'ten']);
  });

  it("uses the sort column's own compare function over the default", () => {
    const sorted = renderSorted({ column: 'name', direction: 'asc' }, [
      { key: 'name', compareFn: (a, b) => b.rank - a.rank },
    ]);

    expect(sorted.map((row) => row.id)).toEqual(['c', 'b', 'a']);
  });

  it('does not mutate the list it was given', () => {
    const items = [...ROWS];

    renderSorted({ column: 'rank', direction: 'asc' }, [], items);

    expect(items.map((row) => row.id)).toEqual(['b', 'c', 'a']);
  });
});
