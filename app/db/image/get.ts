import { getDatabase } from '../database';
import { assertValidId } from '../util';
import type { Image } from './types';

export const get = async (id: string): Promise<Image | null> => {
  assertValidId(id, 'image');

  const db = await getDatabase();
  const result = await db.select<Image[]>(
    'SELECT * FROM images WHERE id = $1',
    [id],
  );

  return result[0] ?? null;
};
