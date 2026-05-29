import { getDatabase } from '../database';

export const set = async (key: string, value: string | null): Promise<void> => {
  const db = await getDatabase();
  await db.execute(
    'INSERT OR REPLACE INTO _system (key, value) VALUES ($1, $2)',
    [key, value],
  );
};
