const getSearchableText = (
  item: Record<string, unknown>,
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

const termMatchesItem = (
  term: string,
  item: Record<string, unknown>,
  searchableColumns: string[],
): boolean => {
  const textByColumn = getSearchableText(item, searchableColumns);
  for (const text of textByColumn.values()) {
    if (text.includes(term)) return true;
  }
  return false;
};

export const allTermsMatchItem = (
  terms: string[],
  item: Record<string, unknown>,
  searchableColumns: string[],
): boolean =>
  terms.every((term) => termMatchesItem(term, item, searchableColumns));
