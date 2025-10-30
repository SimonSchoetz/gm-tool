import Database from '@tauri-apps/plugin-sql';
import { tableSchemas } from './schemas';

let db: Database | null = null;
let initializingPromise: Promise<Database> | null = null;

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

      for (const { name, sql } of tableSchemas) {
        await database.execute(sql);
        console.log(`${name.charAt(0).toUpperCase() + name.slice(1)} table created/verified`);
      }

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
