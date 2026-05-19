import Database from '@tauri-apps/plugin-sql';
import { imageTable } from './image/schema';
import { adventureTable } from './adventure/schema';
import { sessionTable } from './session/schema';
import { sessionStepTable } from './session-step/schema';
import { npcTable } from './npc/schema';
import { foeTable } from './foe/schema';
import { pcTable } from './pc/schema';
import { tableConfigTable } from './table-config/schema';
import { seedTableConfig } from './table-config/seed';

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

      const tableSchemas = [
        { name: 'images', sql: imageTable.createTableSQL },
        { name: 'adventures', sql: adventureTable.createTableSQL },
        { name: 'sessions', sql: sessionTable.createTableSQL },
        { name: 'session_steps', sql: sessionStepTable.createTableSQL },
        { name: 'npcs', sql: npcTable.createTableSQL },
        { name: 'foes', sql: foeTable.createTableSQL },
        { name: 'pcs', sql: pcTable.createTableSQL },
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

      // TEMPORARY MIGRATION — delete after first run
      await database.execute('PRAGMA foreign_keys = OFF');

      await database.execute('DROP TABLE IF EXISTS adventures_migration_temp');
      await database.execute(`
        CREATE TABLE adventures_migration_temp (
          id TEXT PRIMARY KEY,
          name TEXT,
          description TEXT,
          image_id TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          FOREIGN KEY (image_id) REFERENCES images(id) ON DELETE SET NULL
        )
      `);
      await database.execute(
        'INSERT INTO adventures_migration_temp SELECT * FROM adventures',
      );
      await database.execute('DROP TABLE adventures');
      await database.execute(
        'ALTER TABLE adventures_migration_temp RENAME TO adventures',
      );

      await database.execute('DROP TABLE IF EXISTS npcs_migration_temp');
      await database.execute(`
        CREATE TABLE npcs_migration_temp (
          id TEXT PRIMARY KEY,
          adventure_id TEXT NOT NULL,
          name TEXT,
          summary TEXT,
          description TEXT,
          image_id TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          FOREIGN KEY (adventure_id) REFERENCES adventures(id) ON DELETE CASCADE,
          FOREIGN KEY (image_id) REFERENCES images(id) ON DELETE SET NULL
        )
      `);
      await database.execute(
        'INSERT INTO npcs_migration_temp SELECT * FROM npcs',
      );
      await database.execute('DROP TABLE npcs');
      await database.execute('ALTER TABLE npcs_migration_temp RENAME TO npcs');

      await database.execute('PRAGMA foreign_keys = ON');
      // END TEMPORARY MIGRATION

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
