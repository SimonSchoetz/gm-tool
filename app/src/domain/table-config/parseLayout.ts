import type { TableLayout } from './types';

const DEFAULT_LAYOUT: TableLayout = {
  searchable_columns: [],
  columns: [],
  sort_state: null,
};

export const parseLayout = (
  layoutJson: string | null | undefined,
): TableLayout => {
  if (!layoutJson) return DEFAULT_LAYOUT;

  try {
    const parsed = JSON.parse(layoutJson);
    return {
      searchable_columns: Array.isArray(parsed.searchable_columns)
        ? parsed.searchable_columns
        : [],
      columns: Array.isArray(parsed.columns) ? parsed.columns : [],
      sort_state: parsed.sort_state ?? null,
      visible_columns: parsed.visible_columns ?? null,
    };
  } catch {
    return DEFAULT_LAYOUT;
  }
};
