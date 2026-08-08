import { getDatabase } from '../database';
import { assertValidId } from '../util';
import type { Encounter } from './types';

export const getAll = async (adventureId: string): Promise<Encounter[]> => {
  assertValidId(adventureId, 'Adventure');
  const db = await getDatabase();
  const data = await db.select<Encounter[]>(
    'SELECT * FROM encounters WHERE adventure_id = $1 ORDER BY created_at DESC',
    [adventureId],
  );
  return data;
};
