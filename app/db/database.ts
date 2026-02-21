import Database from '@tauri-apps/plugin-sql';
import { imageTable } from './image/schema';
import { adventureTable } from './adventure/schema';
import { sessionTable } from './session/schema';
import { npcTable } from './npc/schema';
import { tableConfigTable } from './table-config/schema';
import { seedTableConfig } from './table-config/seed';

let db: Database | null = null;
let initializingPromise: Promise<Database> | null = null;

const runMigrations = async (database: Database) => {
  try {
    // Check if image_id column exists in adventures table
    const result = await database.select<{ name: string }[]>(
      "SELECT name FROM pragma_table_info('adventures') WHERE name = 'image_id'",
    );

    if (!result || result.length === 0) {
      await database.execute(
        'ALTER TABLE adventures ADD COLUMN image_id TEXT REFERENCES images(id) ON DELETE SET NULL',
      );
      console.log('Migration: Added image_id column to adventures table');
    }

    // Add layout column to table_config and migrate searchable_columns data
    const layoutCol = await database.select<{ name: string }[]>(
      "SELECT name FROM pragma_table_info('table_config') WHERE name = 'layout'",
    );

    if (!layoutCol || layoutCol.length === 0) {
      await database.execute(
        'ALTER TABLE table_config ADD COLUMN layout TEXT',
      );
      console.log('Migration: Added layout column to table_config');
    }

    // Migrate layout from column_widths format to columns format
    const configsToMigrate = await database.select<
      { id: string; table_name: string; searchable_columns: string | null; layout: string | null }[]
    >('SELECT id, table_name, searchable_columns, layout FROM table_config');

    const defaultColumnsByTable: Record<string, Array<{ key: string; label: string; sortable?: boolean; resizable?: boolean; width: number }>> = {
      npcs: [
        { key: 'image_id', label: 'Avatar', sortable: false, resizable: false, width: 136 },
        { key: 'name', label: 'Name', width: 250 },
        { key: 'created_at', label: 'Created At', width: 150 },
        { key: 'updated_at', label: 'Last updated', width: 150 },
      ],
      adventures: [
        { key: 'name', label: 'Name', width: 250 },
        { key: 'created_at', label: 'Created At', width: 150 },
        { key: 'updated_at', label: 'Last updated', width: 150 },
      ],
      sessions: [
        { key: 'name', label: 'Name', width: 250 },
        { key: 'created_at', label: 'Created At', width: 150 },
        { key: 'updated_at', label: 'Last updated', width: 150 },
      ],
    };

    for (const config of configsToMigrate) {
      let needsUpdate = false;
      let parsed: Record<string, unknown> = {};

      if (config.layout) {
        try {
          parsed = JSON.parse(config.layout);
        } catch {
          parsed = {};
        }
      }

      if (!Array.isArray(parsed.columns)) {
        const searchableColumns = Array.isArray(parsed.searchable_columns)
          ? parsed.searchable_columns
          : config.searchable_columns
            ? JSON.parse(config.searchable_columns)
            : [];

        const defaultCols = defaultColumnsByTable[config.table_name] ?? [];
        const persistedWidths =
          parsed.column_widths && typeof parsed.column_widths === 'object'
            ? (parsed.column_widths as Record<string, number>)
            : {};

        const columns = defaultCols.map((col) => ({
          ...col,
          width: persistedWidths[col.key] ?? col.width,
        }));

        const layout = JSON.stringify({
          searchable_columns: searchableColumns,
          columns,
          sort_state: parsed.sort_state ?? null,
        });

        await database.execute(
          'UPDATE table_config SET layout = $1 WHERE id = $2',
          [layout, config.id],
        );
        needsUpdate = true;
      }

      if (needsUpdate) {
        console.log(
          `Migration: Migrated layout to columns format for ${config.table_name}`,
        );
      }
    }
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
};

export const initDatabase = async () => {
  if (db) return db;

  if (initializingPromise) {
    await initializingPromise;
    return db!;
  }

  initializingPromise = (async () => {
    try {
      console.log('Attempting to load database...');
      const database = await Database.load('sqlite:gm_tool.db');
      console.log('Database loaded successfully');

      const tableSchemas = [
        { name: 'images', sql: imageTable.createTableSQL },
        { name: 'adventures', sql: adventureTable.createTableSQL },
        { name: 'sessions', sql: sessionTable.createTableSQL },
        { name: 'npcs', sql: npcTable.createTableSQL },
        { name: 'table_config', sql: tableConfigTable.createTableSQL },
      ];

      for (const { name, sql } of tableSchemas) {
        await database.execute(sql);
        console.log(
          `${
            name.charAt(0).toUpperCase() + name.slice(1)
          } table created/verified`,
        );
      }

      // Run migrations
      await runMigrations(database);

      // Seed table_config with defaults
      await seedTableConfig(database);

      db = database;
      return database;
    } catch (error) {
      console.error('Database initialization failed:', error);
      throw error;
    } finally {
      initializingPromise = null;
    }
  })();

  return await initializingPromise;
};

export const getDatabase = async () => {
  if (!db) {
    await initDatabase();
  }
  return db!;
};
