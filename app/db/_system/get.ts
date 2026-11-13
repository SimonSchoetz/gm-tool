import { getDatabase } from '../database';

export const get = async (key: string): Promise<string | null> => {
  const db = await getDatabase();
  const rows = await db.select<{ value: string | null }[]>(
    'SELECT value FROM _system WHERE id = $1',
    [key],
  );
  return rows[0]?.value ?? null;
};
