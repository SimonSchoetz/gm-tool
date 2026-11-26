import type { SqlDatabase } from '@platform';
import type { Migration } from './index.ts';

const up = async (db: SqlDatabase): Promise<void> => {
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
