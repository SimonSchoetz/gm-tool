import Database from '@tauri-apps/plugin-sql';
import { imageTable } from './image/schema';
import { adventureTable } from './adventure/schema';
import { sessionTable } from './session/schema';
import { npcTable } from './npc/schema';

let db: Database | null = null;
let initializingPromise: Promise<Database> | null = null;

const runMigrations = async (database: Database) => {
  try {
    // Check if image_id column exists in adventures table
    const result = await database.select<{ name: string }[]>(
      "SELECT name FROM pragma_table_info('adventures') WHERE name = 'image_id'"
    );

    if (!result || result.length === 0) {
      // Column doesn't exist, add it
      await database.execute(
        'ALTER TABLE adventures ADD COLUMN image_id TEXT REFERENCES images(id) ON DELETE SET NULL'
      );
      console.log('Migration: Added image_id column to adventures table');
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
      ];

      for (const { name, sql } of tableSchemas) {
        await database.execute(sql);
        console.log(
          `${
            name.charAt(0).toUpperCase() + name.slice(1)
          } table created/verified`
        );
      }

      // Run migrations
      await runMigrations(database);

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
