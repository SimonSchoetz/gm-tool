import type Database from '@tauri-apps/plugin-sql';
import { loadDatabase } from '@platform';
import { runMigrations } from './_migrations';
import { backupDatabase } from './database-backup';

const DATABASE_FILE = 'gm_tool.db';

let db: Database | null = null;
let initializingPromise: Promise<Database> | null = null;

export const initDatabase = async () => {
  if (db) return db;

  if (initializingPromise) {
    await initializingPromise;
    assertDb(db);
    return db;
  }

  initializingPromise = (async () => {
    try {
      console.log('Attempting to load database...');
      const database = await loadDatabase(DATABASE_FILE);
      console.log('Database loaded successfully');
      await runMigrations(database, (ledgerHead) =>
        backupDatabase(database, DATABASE_FILE, ledgerHead),
      );

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
  assertDb(db);
  return db;
};

const assertDb: (db: Database | null) => asserts db = (db) => {
  if (!db) throw new Error('Database not initialized');
};
