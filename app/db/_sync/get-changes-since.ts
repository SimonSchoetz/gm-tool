import { syncChangeRecordError } from '@domain/sync';
import { getDatabase } from '../database';
import { syncChangeRecordSchema } from './schema';
import type { SyncChangeRecord } from './schema';

export const getChangesSince = async (
  sinceSeq: number,
  limit: number,
): Promise<SyncChangeRecord[]> => {
  const db = await getDatabase();
  const rows = await db.select<unknown>(
    'SELECT table_name, row_id, seq, deleted, deleted_at FROM _sync_changes WHERE seq > $1 ORDER BY seq ASC LIMIT $2',
    [sinceSeq, limit],
  );
  const result = syncChangeRecordSchema.array().safeParse(rows);
  if (!result.success) {
    throw syncChangeRecordError(result.error.message);
  }
  return result.data;
};
