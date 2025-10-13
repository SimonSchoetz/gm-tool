import { getDatabase } from '../database';

export const remove = async (id: number): Promise<void> => {
  if (!id || id <= 0) {
    throw new Error('Valid session ID is required');
  }

  const db = await getDatabase();
  await db.execute(
    'DELETE FROM sessions WHERE id = $1',
    [id]
  );
};
