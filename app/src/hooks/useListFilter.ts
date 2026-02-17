import { useMemo } from 'react';

type FilterConfig = {
  searchableColumns: string[];
};

type UseListFilterReturn<T> = {
  nameMatches: T[];
  fieldMatches: T[];
};

export const useListFilter = <T extends Record<string, unknown>>(
  items: T[],
  searchTerm: string,
  config: FilterConfig
): UseListFilterReturn<T> => {
  return useMemo(() => {
    const trimmed = searchTerm.trim().toLowerCase();

    if (!trimmed) {
      return { nameMatches: items, fieldMatches: [] };
    }

    const nameMatches: T[] = [];
    const startsWithName: T[] = [];
    const includesName: T[] = [];
    const fieldMatches: T[] = [];

    const secondaryColumns = config.searchableColumns.filter(
      (col) => col !== 'name'
    );

    for (const item of items) {
      const name = String(item.name ?? '').toLowerCase();

      if (name.startsWith(trimmed)) {
        startsWithName.push(item);
      } else if (name.includes(trimmed)) {
        includesName.push(item);
      } else {
        const matchesSecondary = secondaryColumns.some((col) => {
          const value = item[col];
          if (typeof value !== 'string') return false;
          return value.toLowerCase().includes(trimmed);
        });

        if (matchesSecondary) {
          fieldMatches.push(item);
        }
      }
    }

    nameMatches.push(...startsWithName, ...includesName);

    return { nameMatches, fieldMatches };
  }, [items, searchTerm, config.searchableColumns]);
};
