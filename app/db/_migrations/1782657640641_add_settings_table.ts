import type Database from '@tauri-apps/plugin-sql';

const up = async (db: Database): Promise<void> => {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS _settings (
      id TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `);
  await db.execute(
    'INSERT OR IGNORE INTO _settings (id, value) VALUES ($1, $2)',
    ['background', '{"animation_enabled":true}'],
  );
};

export const addSettingsTableMigration = {
  id: '1782657640641',
  up,
};
