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

    // Add session_date column to sessions table (the actual table, not just table_config)
    const sessionDateCol = await database.select<{ name: string }[]>(
      "SELECT name FROM pragma_table_info('sessions') WHERE name = 'session_date'",
    );
    if (!sessionDateCol || sessionDateCol.length === 0) {
      await database.execute('ALTER TABLE sessions ADD COLUMN session_date TEXT');
      console.log('Migration: Added session_date column to sessions table');
    }

    // Remove NOT NULL constraint from sessions.name (inherited from title rename).
    // SQLite requires table recreation to drop a NOT NULL constraint.
    const sessionNameConstraint = await database.select<{ notnull: number }[]>(
      "SELECT notnull FROM pragma_table_info('sessions') WHERE name = 'name'",
    );
    if (sessionNameConstraint.length > 0 && sessionNameConstraint[0].notnull === 1) {
      await database.execute('PRAGMA foreign_keys = OFF');
      await database.execute(`
        CREATE TABLE sessions_new (
          id TEXT PRIMARY KEY,
          name TEXT,
          description TEXT,
          summary TEXT,
          session_date TEXT,
          adventure_id TEXT NOT NULL REFERENCES adventures(id) ON DELETE CASCADE,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
      `);
      await database.execute(
        'INSERT INTO sessions_new SELECT id, name, description, summary, session_date, adventure_id, created_at, updated_at FROM sessions',
      );
      await database.execute('DROP TABLE sessions');
      await database.execute('ALTER TABLE sessions_new RENAME TO sessions');
      await database.execute('PRAGMA foreign_keys = ON');
      console.log('Migration: Removed NOT NULL constraint from sessions.name');
    }

    // Add session_date column to sessions table_config layout
    const sessionsConfigForDate = await database.select<{ id: string; layout: string }[]>(
      "SELECT id, layout FROM table_config WHERE table_name = 'sessions'",
    );
    if (sessionsConfigForDate.length > 0) {
      const layout = JSON.parse(sessionsConfigForDate[0].layout);
      const hasSessionDate = layout.columns?.some(
        (col: { key: string }) => col.key === 'session_date',
      );
      if (!hasSessionDate) {
        layout.columns.push({ key: 'session_date', label: 'Session Date', width: 250 });
        await database.execute(
          'UPDATE table_config SET layout = $1 WHERE id = $2',
          [JSON.stringify(layout), sessionsConfigForDate[0].id],
        );
        console.log('Migration: Added session_date to sessions table_config columns');
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
