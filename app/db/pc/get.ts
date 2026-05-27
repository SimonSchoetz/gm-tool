import { getDatabase } from '../database';
import { assertValidId } from '../util';
import type { Pc } from './types';

export const get = async (id: string): Promise<Pc | null> => {
  assertValidId(id, 'Pc');
  const db = await getDatabase();

  const result = await db.select<Pc[]>('SELECT * FROM pcs WHERE id = $1', [id]);

  return result[0] ?? null;
};
