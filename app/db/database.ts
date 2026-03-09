import Database from '@tauri-apps/plugin-sql';
import { imageTable } from './image/schema';
import { adventureTable } from './adventure/schema';
import { sessionTable } from './session/schema';
import { sessionStepTable } from './session-step/schema';
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

    // Rename title to name on sessions
    const titleCol = await database.select<{ name: string }[]>(
      "SELECT name FROM pragma_table_info('sessions') WHERE name = 'title'",
    );
    if (titleCol && titleCol.length > 0) {
      await database.execute('ALTER TABLE sessions RENAME COLUMN title TO name');
      console.log('Migration: Renamed title to name on sessions');
    }

    // Add summary column to sessions
    const summaryCol = await database.select<{ name: string }[]>(
      "SELECT name FROM pragma_table_info('sessions') WHERE name = 'summary'",
    );
    if (!summaryCol || summaryCol.length === 0) {
      await database.execute('ALTER TABLE sessions ADD COLUMN summary TEXT');
      console.log('Migration: Added summary column to sessions');
    }

    // Drop notes column from sessions
    const notesCol = await database.select<{ name: string }[]>(
      "SELECT name FROM pragma_table_info('sessions') WHERE name = 'notes'",
    );
    if (notesCol && notesCol.length > 0) {
      await database.execute('ALTER TABLE sessions DROP COLUMN notes');
      console.log('Migration: Dropped notes column from sessions');
    }

    // Update sessions table_config: remove 'notes' from searchable_columns in layout JSON
    const sessionsConfig = await database.select<{ id: string; layout: string }[]>(
      "SELECT id, layout FROM table_config WHERE table_name = 'sessions'",
    );
    if (sessionsConfig.length > 0) {
      const layout = JSON.parse(sessionsConfig[0].layout);
      if (layout.searchable_columns?.includes('notes')) {
        layout.searchable_columns = layout.searchable_columns.filter(
          (col: string) => col !== 'notes',
        );
        await database.execute(
          'UPDATE table_config SET layout = $1 WHERE id = $2',
          [JSON.stringify(layout), sessionsConfig[0].id],
        );
        console.log('Migration: Removed notes from sessions table_config searchable_columns');
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
        { name: 'session_steps', sql: sessionStepTable.createTableSQL },
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
