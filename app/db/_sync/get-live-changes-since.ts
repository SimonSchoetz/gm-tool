import { syncChangeRecordError } from '@domain/sync';
import { getDatabase } from '../database';
import { syncChangeRecordSchema } from './schema';
import type { SyncChangeRecord } from './schema';

// The change records after sinceSeq of those of the given rows of one table that still exist, i.e. whose latest change is not a deletion.
export const getLiveChangesSince = async (
  sinceSeq: number,
  tableName: string,
  rowIds: string[],
): Promise<SyncChangeRecord[]> => {
  const db = await getDatabase();
  const rowIdPlaceholders = rowIds.map((_, index) => `$${index + 3}`);
  const rows = await db.select<unknown>(
    `SELECT table_name, row_id, seq, deleted, deleted_at FROM _sync_changes WHERE seq > $1 AND deleted = 0 AND table_name = $2 AND row_id IN (${rowIdPlaceholders.join(', ')})`,
    [sinceSeq, tableName, ...rowIds],
  );
  const result = syncChangeRecordSchema.array().safeParse(rows);
  if (!result.success) {
    throw syncChangeRecordError(result.error.message);
  }
  return result.data;
};
