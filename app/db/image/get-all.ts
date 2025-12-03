import { getDatabase } from '../database';
import type { Image } from './types';

export const getAll = async (): Promise<Image[]> => {
  const db = await getDatabase();
  const result = await db.select<Image[]>('SELECT * FROM images ORDER BY created_at DESC');

  return result;
};
