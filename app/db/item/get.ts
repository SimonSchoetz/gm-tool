import { getDatabase } from '../database';
import { assertValidId } from '../util';
import type { Item } from './types';

export const get = async (id: string): Promise<Item | null> => {
  assertValidId(id, 'Item');
  const db = await getDatabase();

  const result = await db.select<Item[]>('SELECT * FROM items WHERE id = $1', [
    id,
  ]);

  return result[0] ?? null;
};
