import { useMemo } from 'react';
import { parseSearchTerms } from './helper/parseSearchTerms';
import { allTermsMatchItem } from './helper/allTermsMatchItem';

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
  config: FilterConfig,
): UseListFilterReturn<T> => {
  return useMemo(() => {
    const terms = parseSearchTerms(searchTerm);

    if (terms.length === 0) {
      return { nameMatches: items, fieldMatches: [] };
    }

    const secondaryColumns = config.searchableColumns.filter(
      (col) => col !== 'name',
    );

    const startsWithName: T[] = [];
    const includesName: T[] = [];
    const fieldMatches: T[] = [];

    for (const item of items) {
      if (!allTermsMatchItem(terms, item, config.searchableColumns)) {
        continue;
      }

      const name = String(item.name ?? '').toLowerCase();
      const primaryTerm = terms[0];

      if (name.startsWith(primaryTerm)) {
        startsWithName.push(item);
      } else if (name.includes(primaryTerm)) {
        includesName.push(item);
      } else {
        const nameMatchesAnyTerm = terms.some((term) => name.includes(term));

        if (nameMatchesAnyTerm) {
          includesName.push(item);
        } else {
          const matchesSecondary = secondaryColumns.some((col) => {
            const value = item[col];
            if (typeof value !== 'string') return false;
            return terms.some((term) => value.toLowerCase().includes(term));
          });

          if (matchesSecondary) {
            fieldMatches.push(item);
          }
        }
      }
    }

    return {
      nameMatches: [...startsWithName, ...includesName],
      fieldMatches,
    };
  }, [items, searchTerm, config.searchableColumns]);
};
