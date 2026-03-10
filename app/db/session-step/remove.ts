import { getDatabase } from '../database';

export const remove = async (id: string): Promise<void> => {
  const db = await getDatabase();
  await db.execute('DELETE FROM session_steps WHERE id = $1', [id]);
};
