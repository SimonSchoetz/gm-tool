import { getDatabase } from '../database';

export const getMaxSeq = async (): Promise<number> => {
  const db = await getDatabase();
  const rows = await db.select<{ value: number }[]>(
    "SELECT value FROM _sync_meta WHERE id = 'seq'",
  );
  return rows[0]?.value ?? 0;
};
