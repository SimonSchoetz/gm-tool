export type SortDirection = 'asc' | 'desc';

export type PersistedSortState = {
  column: string;
  direction: SortDirection;
};

export type LayoutColumn = {
  key: string;
  label: string;
  sortable?: boolean;
  resizable?: boolean;
  width: number;
};

export type TableLayout = {
  searchable_columns: string[];
  columns: LayoutColumn[];
  sort_state: PersistedSortState | null;
  visible_columns?: string[] | null;
};
