import type { TableConfig } from '@db/table-config';

export const buildTableConfig = (
  overrides: Partial<TableConfig> = {},
): TableConfig => ({
  id: 'config-1',
  table_name: 'npcs',
  color: '#ffffff',
  tagging_enabled: 1,
  scope: 'adventure',
  layout: {
    searchable_columns: [],
    columns: [],
    sort_state: { column: 'name', direction: 'asc' },
  },
  created_at: '',
  updated_at: '',
  ...overrides,
});
