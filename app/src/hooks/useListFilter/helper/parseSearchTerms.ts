const TERM_SEPARATOR = ',';

export const parseSearchTerms = (searchTerm: string): string[] =>
  searchTerm
    .split(TERM_SEPARATOR)
    .map((t) => t.trim().toLowerCase())
    .filter((t) => t.length > 0);
