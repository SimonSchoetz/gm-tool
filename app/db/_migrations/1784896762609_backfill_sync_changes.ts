import type Database from '@tauri-apps/plugin-sql';

// FK dependency order: parents before children. Frozen migration-local copy of db/_sync/registry.ts — see app/db/CLAUDE.md — Migrations for why.
const SYNCED_TABLE_NAMES = [
  'images',
  'adventures',
  'sessions',
  'npcs',
  'pcs',
  'foes',
  'factions',
  'locations',
  'items',
  'session_steps',
  'table_config',
];

const up = async (db: Database): Promise<void> => {
  for (const tableName of SYNCED_TABLE_NAMES) {
    // tableName is interpolated directly because SQL does not support parameterized table names. It must only ever receive values from SYNCED_TABLE_NAMES, which is a fixed local constant — never from user input (mirrors mention-search.ts).
    const rows = await db.select<{ id: string }[]>(
      `SELECT id FROM ${tableName}`,
    );

    for (const row of rows) {
      // The sync triggers added by the previous migration only fire on writes that happen after they were created, so every row that already existed has no _sync_changes entry and is invisible to getChangesSince — it would never reach a paired device. Bumping the seq counter unconditionally before the guarded insert below "wastes" a seq value on a row that turns out to already have a change record (edited since upgrading) — harmless, since seq only needs to be monotonically increasing, not contiguous.
      await db.execute(
        "UPDATE _sync_meta SET value = value + 1 WHERE id = 'seq'",
      );
      // ON CONFLICT DO NOTHING: a row already synced-and-edited since the previous migration ran already has a legitimate trigger-written change record — never overwrite it with this backfill's placeholder one.
      await db.execute(
        `INSERT INTO _sync_changes (id, table_name, row_id, seq, deleted, deleted_at)
         VALUES ($1, $2, $3, (SELECT value FROM _sync_meta WHERE id = 'seq'), 0, NULL)
         ON CONFLICT(id) DO NOTHING`,
        [`${tableName}:${row.id}`, tableName, row.id],
      );
    }
  }
};

export const backfillSyncChangesMigration = {
  id: '1784896762609',
  up,
};
