import { getDatabase } from '../database';

export const update = async (key: string, value: string | null): Promise<void> => {
  const db = await getDatabase();
  await db.execute(
    'INSERT OR REPLACE INTO _system (id, value) VALUES ($1, $2)',
    [key, value],
  );
};
