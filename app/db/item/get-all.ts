import { getDatabase } from '../database';
import { assertValidId } from '../util';
import type { Item } from './types';

export const getAll = async (adventureId: string): Promise<Item[]> => {
  assertValidId(adventureId, 'Adventure');
  const db = await getDatabase();

  const data = await db.select<Item[]>(
    'SELECT * FROM items WHERE adventure_id = $1 ORDER BY created_at DESC',
    [adventureId],
  );

  return data;
};
