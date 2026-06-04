import type Database from '@tauri-apps/plugin-sql';

const up = async (db: Database): Promise<void> => {
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

export const initSystemMigration = {
  id: '1780575810242',
  up,
};
