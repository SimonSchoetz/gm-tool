import { getDatabase } from '../database';
import { assertValidId } from '../util';
import type { Encounter } from './types';

export const get = async (id: string): Promise<Encounter | null> => {
  assertValidId(id, 'Encounter');
  const db = await getDatabase();
  const result = await db.select<Encounter[]>(
    'SELECT * FROM encounters WHERE id = $1',
    [id],
  );
  return result[0] ?? null;
};
