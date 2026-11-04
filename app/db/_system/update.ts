import { getDatabase } from '../database';

export const update = async (
  // eslint-disable-next-line local/no-constant-argument -- the raw accessor of the `_system` key-value table, which each typed per-key accessor calls with its key
  key: string,
  value: string | null,
): Promise<void> => {
  const db = await getDatabase();
  await db.execute(
    'INSERT OR REPLACE INTO _system (id, value) VALUES ($1, $2)',
    [key, value],
  );
};
