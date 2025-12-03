import { getDatabase } from '../database';
import type { Image } from './types';

export const get = async (id: string): Promise<Image | null> => {
  if (!id) {
    throw new Error('Image ID is required');
  }

  const db = await getDatabase();
  const result = await db.select<Image[]>(
    'SELECT * FROM images WHERE id = $1',
    [id]
  );

  return result[0] ?? null;
};
