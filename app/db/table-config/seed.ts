import type Database from '@tauri-apps/plugin-sql';
import { create } from './create';
import type { CreateTableConfigInput } from './types';

const defaultConfigs: CreateTableConfigInput[] = [
  {
    table_name: 'adventures',
    color: '#4a9eff',
    tagging_enabled: 0,
    scope: 'global',
    layout: {
      searchable_columns: ['name', 'description'],
      columns: [
        { key: 'name', label: 'Name', width: 250 },
        { key: 'created_at', label: 'Created At', width: 150 },
        { key: 'updated_at', label: 'Last updated', width: 150 },
      ],
      sort_state: { column: 'updated_at', direction: 'desc' },
    },
  },
  {
    table_name: 'npcs',
    color: '#ff6b6b',
    tagging_enabled: 1,
    scope: 'adventure',
    layout: {
      searchable_columns: ['name', 'summary', 'description'],
      columns: [
        {
          key: 'image_id',
          label: 'Avatar',
          sortable: false,
          resizable: false,
          width: 136,
        },
        { key: 'name', label: 'Name', width: 250 },
        { key: 'created_at', label: 'Created At', width: 150 },
        { key: 'updated_at', label: 'Last updated', width: 150 },
      ],
      sort_state: { column: 'updated_at', direction: 'desc' },
    },
  },
  {
    table_name: 'sessions',
    color: '#51cf66',
    tagging_enabled: 0,
    scope: 'adventure',
    layout: {
      searchable_columns: ['name', 'description', 'notes'],
      columns: [
        { key: 'name', label: 'Name', width: 250 },
        { key: 'created_at', label: 'Created At', width: 150 },
        { key: 'updated_at', label: 'Last updated', width: 150 },
      ],
      sort_state: { column: 'updated_at', direction: 'desc' },
    },
  },
];

export const seedTableConfig = async (database: Database) => {
  for (const config of defaultConfigs) {
    const existing = await database.select<{ id: string }[]>(
      'SELECT id FROM table_config WHERE table_name = $1',
      [config.table_name],
    );

    if (existing.length === 0) {
      await create(config);
      console.log(`Seeded table_config: ${config.table_name}`);
    }
  }
};
