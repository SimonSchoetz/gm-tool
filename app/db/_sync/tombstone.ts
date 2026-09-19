import type Database from '@tauri-apps/plugin-sql';

// Every `_sync_changes` row has this id. The sync triggers build the same id in SQL (`'<table>:' || NEW.id`, in 1784365870026_add_sync_infrastructure.ts), which cannot import this function.
export const changeRecordId = (tableName: string, rowId: string): string =>
  `${tableName}:${rowId}`;

export const getTombstoneDeletedAt = async (
  db: Database,
  tableName: string,
  rowId: string,
): Promise<string | null> => {
  const rows = await db.select<{ deleted_at: string | null }[]>(
    'SELECT deleted_at FROM _sync_changes WHERE id = $1 AND deleted = 1',
    [changeRecordId(tableName, rowId)],
  );
  return rows[0]?.deleted_at ?? null;
};
