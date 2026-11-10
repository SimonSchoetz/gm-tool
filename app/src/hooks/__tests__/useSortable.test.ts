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

  it('puts empty values after every value in an ascending sort and before every value in a descending one, wherever they stood', () => {
    const rows: Row[] = [
      { id: 'n1', name: null, rank: 1 },
      { id: 'delta', name: 'Delta', rank: 2 },
      { id: 'n2', name: null, rank: 3 },
      { id: 'bravo', name: 'Bravo', rank: 4 },
      { id: 'n3', name: null, rank: 5 },
      { id: 'alpha', name: 'Alpha', rank: 6 },
    ];

    expect(
      renderSorted({ column: 'name', direction: 'asc' }, [], rows).map(
        (row) => row.id,
      ),
    ).toEqual(['alpha', 'bravo', 'delta', 'n1', 'n2', 'n3']);
    expect(
      renderSorted({ column: 'name', direction: 'desc' }, [], rows).map(
        (row) => row.id,
      ),
    ).toEqual(['n1', 'n2', 'n3', 'delta', 'bravo', 'alpha']);
  });

  it('compares strings by locale, ignoring case', () => {
    const rows: Row[] = [
      { id: 'bravo', name: 'Bravo', rank: 1 },
      { id: 'alpha', name: 'alpha', rank: 2 },
      { id: 'charlie', name: 'charlie', rank: 3 },
    ];

    const sorted = renderSorted({ column: 'name', direction: 'asc' }, [], rows);

    expect(sorted.map((row) => row.id)).toEqual(['alpha', 'bravo', 'charlie']);
  });

  it.each([['asc'], ['desc']] as const)(
    'keeps rows with equal values in their given order in a %s sort',
    (direction) => {
      const rows: Row[] = [
        { id: 'first', name: 'same', rank: 5 },
        { id: 'low', name: 'same', rank: 1 },
        { id: 'second', name: 'same', rank: 5 },
        { id: 'third', name: 'same', rank: 5 },
      ];

      const sorted = renderSorted({ column: 'rank', direction }, [], rows);

      expect(
        sorted.filter((row) => row.rank === 5).map((row) => row.id),
      ).toEqual(['first', 'second', 'third']);
    },
  );

  it('sorts numbers descending', () => {
    const rows: Row[] = [
      { id: 'two', name: 'x', rank: 2 },
      { id: 'ten', name: 'x', rank: 10 },
      { id: 'five', name: 'x', rank: 5 },
    ];

    const sorted = renderSorted(
      { column: 'rank', direction: 'desc' },
      [],
      rows,
    );

    expect(sorted.map((row) => row.id)).toEqual(['ten', 'five', 'two']);
  });

  it('uses the compare function of the column it sorts by, not of another column', () => {
    const sorted = renderSorted({ column: 'rank', direction: 'asc' }, [
      { key: 'name', compareFn: () => 0 },
      { key: 'rank', compareFn: (a, b) => b.rank - a.rank },
    ]);

    expect(sorted.map((row) => row.id)).toEqual(['c', 'b', 'a']);
  });

  it('sorts again when the list or the direction changes', () => {
    const { result, rerender } = renderHook(
      ({ items, direction }: { items: Row[]; direction: 'asc' | 'desc' }) =>
        useSortable(items, {
          sortState: { column: 'rank', direction },
          columns: [],
        }),
      { initialProps: { items: ROWS, direction: 'asc' as 'asc' | 'desc' } },
    );
    expect(result.current.map((row) => row.id)).toEqual(['a', 'b', 'c']);

    rerender({ items: ROWS, direction: 'desc' });
    expect(result.current.map((row) => row.id)).toEqual(['c', 'b', 'a']);

    rerender({
      items: [{ id: 'z', name: 'Zulu', rank: 9 }, ...ROWS],
      direction: 'desc',
    });
    expect(result.current.map((row) => row.id)).toEqual(['z', 'c', 'b', 'a']);
  });
});
