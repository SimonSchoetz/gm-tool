import type Database from '@tauri-apps/plugin-sql';

const defaultConfigs = [
  {
    id: 'config_adventures',
    table_name: 'adventures',
    display_name: 'Adventures',
    color: '#4a9eff',
    tagging_enabled: 0,
    scope: 'global',
    searchable_columns: '["name","description"]',
  },
  {
    id: 'config_npcs',
    table_name: 'npcs',
    display_name: 'NPCs',
    color: '#ff6b6b',
    tagging_enabled: 1,
    scope: 'adventure',
    searchable_columns: '["name","summary","description"]',
  },
  {
    id: 'config_sessions',
    table_name: 'sessions',
    display_name: 'Sessions',
    color: '#51cf66',
    tagging_enabled: 0,
    scope: 'adventure',
    searchable_columns: '["name","description","notes"]',
  },
];

export const seedTableConfig = async (database: Database) => {
  for (const config of defaultConfigs) {
    const existing = await database.select<{ id: string }[]>(
      'SELECT id FROM table_config WHERE id = $1',
      [config.id],
    );

    if (existing.length === 0) {
      await database.execute(
        `INSERT INTO table_config (id, table_name, display_name, color, tagging_enabled, scope, searchable_columns)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          config.id,
          config.table_name,
          config.display_name,
          config.color,
          config.tagging_enabled,
          config.scope,
          config.searchable_columns,
        ],
      );
      console.log(`Seeded table_config: ${config.table_name}`);
    }
  }
};
