import { getDatabase } from '../database';
import { assertValidId } from '../util';
import type { Location } from './types';

export const get = async (id: string): Promise<Location | null> => {
  assertValidId(id, 'Location');
  const db = await getDatabase();

  const result = await db.select<Location[]>('SELECT * FROM locations WHERE id = $1', [
    id,
  ]);

  return result[0] ?? null;
};
