import { getDatabase } from '../database';
import { assertValidId } from '../util';
import type { Foe } from './types';

export const get = async (id: string): Promise<Foe | null> => {
  assertValidId(id, 'Foe');
  const db = await getDatabase();
  const result = await db.select<Foe[]>('SELECT * FROM foes WHERE id = $1', [id]);
  return result[0] ?? null;
};
