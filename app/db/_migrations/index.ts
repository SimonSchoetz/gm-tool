import type Database from '@tauri-apps/plugin-sql';
import { initialSchemaMigration } from './1779321600000_initial_schema';
import { seedTableConfigMigration } from './1780099200000_seed_table_config';

export type Migration = {
  id: string;
  up: (db: Database) => Promise<void>;
};

export const migrations: Migration[] = [
  initialSchemaMigration,
  seedTableConfigMigration,
];

export const runMigrations = async (db: Database): Promise<void> => {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL
    )
  `);

  const applied = await db.select<{ id: string }[]>(
    'SELECT id FROM _migrations',
  );
  const appliedIds = new Set(applied.map((r) => r.id));

  const pending = migrations
    .filter((m) => !appliedIds.has(m.id))
    .sort((a, b) => a.id.localeCompare(b.id));

  for (const migration of pending) {
    await db.execute('BEGIN');
    try {
      await migration.up(db);
      await db.execute(
        'INSERT INTO _migrations (id, applied_at) VALUES ($1, $2)',
        [migration.id, new Date().toISOString()],
      );
      await db.execute('COMMIT');
    } catch (error) {
      await db.execute('ROLLBACK');
      throw error;
    }
  }
};
