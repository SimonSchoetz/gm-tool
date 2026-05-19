import { getDatabase } from '../database';
import { assertValidId } from '../util';
import type { Pc } from './types';

export const getAll = async (adventureId: string): Promise<Pc[]> => {
  assertValidId(adventureId, 'Adventure');
  const db = await getDatabase();

  const data = await db.select<Pc[]>(
    'SELECT * FROM pcs WHERE adventure_id = $1 ORDER BY created_at DESC',
    [adventureId],
  );

  return data;
};
