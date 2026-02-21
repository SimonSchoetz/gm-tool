import { useMemo, useState } from 'react';

export type SortDirection = 'asc' | 'desc';

export type SortState<T> = {
  column: keyof T & string;
  direction: SortDirection;
};

type SortableColumn<T> = {
  key: keyof T & string;
  compareFn?: (a: T, b: T) => number;
};

type UseSortableConfig<T> = {
  defaultSort: SortState<T>;
  columns: SortableColumn<T>[];
  onSortChange?: (state: SortState<T>) => void;
};

type UseSortableReturn<T> = {
  sortedItems: T[];
  sortState: SortState<T>;
  toggleSort: (column: keyof T & string) => void;
};

const defaultCompare = <T,>(a: T, b: T, key: keyof T): number => {
  const aVal = a[key];
  const bVal = b[key];

  if (aVal == null && bVal == null) return 0;
  if (aVal == null) return 1;
  if (bVal == null) return -1;

  if (typeof aVal === 'string' && typeof bVal === 'string') {
    return aVal.localeCompare(bVal);
  }

  if (aVal < bVal) return -1;
  if (aVal > bVal) return 1;
  return 0;
};

export const useSortable = <T,>(
  items: T[],
  config: UseSortableConfig<T>
): UseSortableReturn<T> => {
  const [sortState, setSortState] = useState<SortState<T>>(config.defaultSort);

  const toggleSort = (column: keyof T & string) => {
    setSortState((prev) => {
      const next: SortState<T> =
        prev.column === column
          ? { column, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
          : { column, direction: 'asc' };
      config.onSortChange?.(next);
      return next;
    });
  };

  const sortedItems = useMemo(() => {
    const columnConfig = config.columns.find((c) => c.key === sortState.column);
    const compareFn = columnConfig?.compareFn
      ?? ((a: T, b: T) => defaultCompare(a, b, sortState.column));

    const directionMultiplier = sortState.direction === 'asc' ? 1 : -1;

    return [...items].sort((a, b) => compareFn(a, b) * directionMultiplier);
  }, [
    items,
    sortState.column,
    sortState.direction,
    config.columns,
  ]);

  return {
    sortedItems,
    sortState,
    toggleSort,
  };
};
