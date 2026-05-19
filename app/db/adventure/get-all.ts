import { getDatabase } from '../database';
import type { Adventure } from './types';

export const getAll = async (): Promise<Adventure[]> => {
  const db = await getDatabase();
  return db.select<Adventure[]>('SELECT * FROM adventures ORDER BY created_at DESC');
};
