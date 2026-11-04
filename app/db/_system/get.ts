import { getDatabase } from '../database';

// eslint-disable-next-line local/no-constant-argument -- the raw accessor of the `_system` key-value table, which each typed per-key accessor calls with its key
export const get = async (key: string): Promise<string | null> => {
  const db = await getDatabase();
  const rows = await db.select<{ value: string | null }[]>(
    'SELECT value FROM _system WHERE id = $1',
    [key],
  );
  return rows[0]?.value ?? null;
};
