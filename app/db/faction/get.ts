import { getDatabase } from '../database';
import { assertValidId } from '../util';
import type { Faction } from './types';

export const get = async (id: string): Promise<Faction | null> => {
  assertValidId(id, 'Faction');
  const db = await getDatabase();

  const result = await db.select<Faction[]>(
    'SELECT * FROM factions WHERE id = $1',
    [id],
  );

  return result[0] ?? null;
};
