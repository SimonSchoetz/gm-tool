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

    // Drop display_name column if it exists (was added as unrequested frontend concern)
    const displayNameCol = await database.select<{ name: string }[]>(
      "SELECT name FROM pragma_table_info('table_config') WHERE name = 'display_name'",
    );
    if (displayNameCol && displayNameCol.length > 0) {
      await database.execute(
        'ALTER TABLE table_config DROP COLUMN display_name',
      );
      console.log('Migration: Dropped display_name column from table_config');
    }

    // Drop searchable_columns column if it exists (data moved into layout JSON)
    const searchableCol = await database.select<{ name: string }[]>(
      "SELECT name FROM pragma_table_info('table_config') WHERE name = 'searchable_columns'",
    );
    if (searchableCol && searchableCol.length > 0) {
      await database.execute(
        'ALTER TABLE table_config DROP COLUMN searchable_columns',
      );
      console.log('Migration: Dropped searchable_columns column from table_config');
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
