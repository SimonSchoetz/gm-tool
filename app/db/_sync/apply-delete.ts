import type Database from '@tauri-apps/plugin-sql';
import { getDatabase } from '../database';

type ApplyResult = 'applied' | 'skipped';

const upsertTombstone = async (
  db: Database,
  tableName: string,
  rowId: string,
  deletedAt: string,
  bumpCounter: boolean,
): Promise<void> => {
  if (bumpCounter) {
    await db.execute(
      "UPDATE _sync_meta SET value = value + 1 WHERE id = 'seq'",
    );
  }

  await db.execute(
    `INSERT INTO _sync_changes (id, table_name, row_id, seq, deleted, deleted_at)
     VALUES ($1, $2, $3, (SELECT value FROM _sync_meta WHERE id = 'seq'), 1, $4)
     ON CONFLICT(id) DO UPDATE SET seq = excluded.seq, deleted = 1, deleted_at = excluded.deleted_at`,
    [`${tableName}:${rowId}`, tableName, rowId, deletedAt],
  );
};

export const applyDelete = async (
  tableName: string,
  rowId: string,
  deletedAt: string,
): Promise<ApplyResult> => {
  const db = await getDatabase();

  // tableName is interpolated directly because SQL does not support parameterized
  // table names. It must only ever receive values from SYNCED_TABLE_NAMES, which
  // is a fixed registry constant — never from user input (mirrors mention-search.ts).
  const localRows = await db.select<{ updated_at: string }[]>(
    `SELECT updated_at FROM ${tableName} WHERE id = $1`,
    [rowId],
  );

  if (localRows.length > 0) {
    const local = localRows[0];
    if (local.updated_at >= deletedAt) return 'skipped';

    // Fires the delete trigger, which bumps the counter and stamps a fresh
    // local deleted_at — overwrite it below with the origin value so LWW
    // truth is preserved while the fresh seq still propagates onward.
    await db.execute(`DELETE FROM ${tableName} WHERE id = $1`, [rowId]);
    await upsertTombstone(db, tableName, rowId, deletedAt, false);
    return 'applied';
  }

  // No local row and no trigger fires — record the tombstone directly so a
  // late insert of this row is blocked and the deletion relays onward.
  await upsertTombstone(db, tableName, rowId, deletedAt, true);
  return 'applied';
};
