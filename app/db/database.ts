import Database from '@tauri-apps/plugin-sql';
import { runMigrations } from './_migrations';

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
      if (
        import.meta.env.DEV &&
        !import.meta.env.TEST &&
        !('__TAURI_INTERNALS__' in window)
      ) {
        throw new Error(
          'No Tauri IPC bridge found — the database is unreachable from `npm run web`. Run `npm run dev` instead to reach the database.',
        );
      }
      console.log('Attempting to load database...');
      const database = await Database.load('sqlite:gm_tool.db');
      console.log('Database loaded successfully');
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
  assertDb(db);
  return db;
};

const assertDb: (db: Database | null) => asserts db = (db) => {
  if (!db) throw new Error('Database not initialized');
};
