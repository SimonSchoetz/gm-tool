import type Database from '@tauri-apps/plugin-sql';
import type { Migration } from './index';

const up = async (db: Database): Promise<void> => {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS paired_devices (
      id TEXT PRIMARY KEY,
      name TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);
};

export const addPairedDevicesTableMigration: Migration = {
  id: '1783763409778',
  up,
};
