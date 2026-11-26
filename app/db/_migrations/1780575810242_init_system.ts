import type { SqlDatabase } from '@platform';
import type { Migration } from './index.ts';

const up = async (db: SqlDatabase): Promise<void> => {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS _system (
      id TEXT PRIMARY KEY,
      value TEXT
    )
  `);
  await db.execute(
    'INSERT OR IGNORE INTO _system (id, value) VALUES ($1, $2)',
    ['versioning', '{"snoozed_update_version":null}'],
  );
};

export const initSystemMigration: Migration = {
  id: '1780575810242',
  up,
};
