import { getDatabase } from '../database';

export const remove = async (id: string): Promise<void> => {
  if (!id || typeof id !== 'string' || id.trim() === '') {
    throw new Error('Valid session ID is required');
  }

  const db = await getDatabase();
  await db.execute('DELETE FROM sessions WHERE id = $1', [id]);
};
