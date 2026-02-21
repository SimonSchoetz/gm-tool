import { useMemo } from 'react';

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
  sortState: SortState<T>;
  columns: SortableColumn<T>[];
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
  config: UseSortableConfig<T>,
): T[] => {
  return useMemo(() => {
    const { sortState, columns } = config;
    const columnConfig = columns.find((c) => c.key === sortState.column);
    const compareFn = columnConfig?.compareFn
      ?? ((a: T, b: T) => defaultCompare(a, b, sortState.column));

    const directionMultiplier = sortState.direction === 'asc' ? 1 : -1;

    return [...items].sort((a, b) => compareFn(a, b) * directionMultiplier);
  }, [items, config.sortState.column, config.sortState.direction, config.columns]);
};
