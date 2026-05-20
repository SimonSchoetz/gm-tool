import { getDatabase } from '../database';
import { assertValidId } from '../util';
import type { Faction } from './types';

export const getAll = async (adventureId: string): Promise<Faction[]> => {
  assertValidId(adventureId, 'Adventure');
  const db = await getDatabase();

  const data = await db.select<Faction[]>(
    'SELECT * FROM factions WHERE adventure_id = $1 ORDER BY created_at DESC',
    [adventureId],
  );

  return data;
};
