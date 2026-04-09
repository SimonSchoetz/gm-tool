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

// const runMigrations = async (database: Database) => {
//   try {

//   } catch (error) {
//     console.error('Migration failed:', error);
//     throw error;
//   }
// };

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
      // await runMigrations(database);

      // Seed table_config with defaults
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
