import type Database from '@tauri-apps/plugin-sql';
import { initialSchemaMigration } from './1779321600000_initial_schema';
import { seedTableConfigMigration } from './1780099200000_seed_table_config';
import { initSystemMigration } from './1780575810242_init_system';
import { addSettingsTableMigration } from './1782657640641_add_settings_table';
import { addPairedDevicesTableMigration } from './1783763409778_add_paired_devices_table';
import { addSyncInfrastructureMigration } from './1784365870026_add_sync_infrastructure';
import { backfillSyncChangesMigration } from './1784896762609_backfill_sync_changes';
import { addPinnedOrderMigration } from './1786002768594_add_pinned_order';
import { addEncountersMigration } from './1786186021664_add_encounters';
import { addTableConfigUniqueIndexMigration } from './1787825905519_add_table_config_unique_index';

export type Migration = {
  id: string;
  up: (db: Database) => Promise<void>;
};

export const migrations: Migration[] = [
  initialSchemaMigration,
  seedTableConfigMigration,
  initSystemMigration,
  addSettingsTableMigration,
  addPairedDevicesTableMigration,
  addSyncInfrastructureMigration,
  backfillSyncChangesMigration,
  addPinnedOrderMigration,
  addEncountersMigration,
  addTableConfigUniqueIndexMigration,
];

// Equals the applied migration head after init; read here (not from the DB) to avoid an import cycle through database.ts.
export const migrationHead: string = migrations[migrations.length - 1].id;

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

  // No BEGIN/COMMIT wrapper: tauri-plugin-sql checks out an arbitrary pooled connection per db.execute() call, so raw-SQL BEGIN/COMMIT sent across separate calls is not atomic (see app/db/CLAUDE.md — Migrations, and .claude/knowledge/tauri.md + sqlite.md for the verified mechanism). Every migration.up() must therefore be independently safe to resume after a partial failure.
  for (const migration of pending) {
    await migration.up(db);
    await db.execute(
      'INSERT INTO _migrations (id, applied_at) VALUES ($1, $2)',
      [migration.id, new Date().toISOString()],
    );
  }
};
