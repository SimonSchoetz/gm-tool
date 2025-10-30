import { getDatabase } from '../database';
import type { Adventure } from './types';

export const get = async (id: string): Promise<Adventure | null> => {
  if (!id || typeof id !== 'string' || id.trim() === '') {
    throw new Error('Valid adventure ID is required');
  }

  const db = await getDatabase();
  const result = await db.select<Adventure[]>(
    'SELECT * FROM adventures WHERE id = $1',
    [id]
  );

  return result.length > 0 ? result[0] : null;
};
