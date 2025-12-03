import { getDatabase } from '../database';

export const remove = async (id: string): Promise<void> => {
  if (!id) {
    throw new Error('Image ID is required');
  }

  const db = await getDatabase();
  await db.execute('DELETE FROM images WHERE id = $1', [id]);
};
