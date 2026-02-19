const getSearchableText = <T extends Record<string, unknown>>(
  item: T,
  columns: string[],
): Map<string, string> => {
  const textByColumn = new Map<string, string>();
  for (const col of columns) {
    const value = item[col];
    if (typeof value === 'string') {
      textByColumn.set(col, value.toLowerCase());
    }
  }
  return textByColumn;
};

const termMatchesItem = <T extends Record<string, unknown>>(
  term: keyof T & string,
  item: T,
  searchableColumns: string[],
): boolean => {
  const textByColumn = getSearchableText(item, searchableColumns);
  for (const text of textByColumn.values()) {
    if (text.includes(term)) return true;
  }
  return false;
};

export const allTermsMatchItem = <T extends Record<string, unknown>>(
  terms: Array<keyof T & string>,
  item: T,
  searchableColumns: string[],
): boolean =>
  terms.every((term) => termMatchesItem(term, item, searchableColumns));
