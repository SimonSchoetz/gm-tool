import type Database from '@tauri-apps/plugin-sql';

const up = async (db: Database): Promise<void> => {
  // Defensive dedup before the unique index: a migration that inserts into table_config with a fresh id per retry (see seed_table_config.ts / add_encounters.ts) could have left duplicate rows for the same table_name on an install that hit a partial migration failure before this fix landed. Keeps the earliest row per table_name, tie-broken by id.
  await db.execute(`
    DELETE FROM table_config
    WHERE id NOT IN (
      SELECT id FROM (
        SELECT id, ROW_NUMBER() OVER (
          PARTITION BY table_name ORDER BY created_at ASC, id ASC
        ) AS rn
        FROM table_config
      )
      WHERE rn = 1
    )
  `);

  await db.execute(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_table_config_table_name
      ON table_config (table_name)
  `);
};

export const addTableConfigUniqueIndexMigration = {
  id: '1787825905519',
  up,
};
