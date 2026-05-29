import Database from '@tauri-apps/plugin-sql';
import { seedTableConfig } from './table-config/seed';
import { runMigrations } from './migrations';

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
      const database = await Database.load('sqlite:gm_tool.db');
      console.log('Database loaded successfully');

      await database.execute(`
        CREATE TABLE IF NOT EXISTS _migrations (
          id TEXT PRIMARY KEY,
          applied_at TEXT NOT NULL
        )
      `);

      await database.execute(`
        CREATE TABLE IF NOT EXISTS _system (
          key TEXT PRIMARY KEY,
          value TEXT
        )
      `);

      await database.execute(
        'INSERT OR IGNORE INTO _system (key, value) VALUES ($1, $2)',
        ['versioning', null],
      );

      await runMigrations(database);

      db = database;
      await seedTableConfig(database);
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
