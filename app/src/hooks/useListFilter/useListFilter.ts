import { useMemo } from 'react';
import { parseSearchTerms } from './helper/parseSearchTerms';
import { allTermsMatchItem } from './helper/allTermsMatchItem';

type FilterConfig<T> = {
  searchableColumns: (keyof T & string)[];
};

type UseListFilterReturn<T> = {
  nameMatches: T[];
  fieldMatches: T[];
};

export const useListFilter = <T extends Record<string, unknown>>(
  items: T[],
  searchTerm: string,
  config: FilterConfig<T>,
): UseListFilterReturn<T> => {
  return useMemo(() => {
    const terms = parseSearchTerms(searchTerm);

    if (terms.length === 0) {
      return { nameMatches: items, fieldMatches: [] };
    }

    const startsWithName: T[] = [];
    const includesName: T[] = [];
    const fieldMatches: T[] = [];

    for (const item of items) {
      if (!allTermsMatchItem(terms, item, config.searchableColumns)) {
        continue;
      }

      const name = (
        typeof item.name === 'string' ? item.name : ''
      ).toLowerCase();
      const primaryTerm = terms[0];

      if (name.startsWith(primaryTerm)) {
        startsWithName.push(item);
      } else if (terms.some((term) => name.includes(term))) {
        includesName.push(item);
      } else {
        fieldMatches.push(item);
      }
    }

    return {
      nameMatches: [...startsWithName, ...includesName],
      fieldMatches,
    };
  }, [items, searchTerm, config.searchableColumns]);
};
