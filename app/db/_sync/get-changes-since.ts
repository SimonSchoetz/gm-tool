import { getDatabase } from '../database';
import type { SyncChangeRecord } from './schema';

export const getChangesSince = async (
  sinceSeq: number,
  limit: number,
): Promise<SyncChangeRecord[]> => {
  const db = await getDatabase();
  return db.select<SyncChangeRecord[]>(
    'SELECT table_name, row_id, seq, deleted, deleted_at FROM _sync_changes WHERE seq > $1 ORDER BY seq ASC LIMIT $2',
    [sinceSeq, limit],
  );
};
