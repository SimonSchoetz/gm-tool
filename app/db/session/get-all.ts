import { getDatabase } from '../database';
import { assertValidId } from '../util';
import type { Session } from './types';

export const getAll = async (adventureId: string): Promise<Session[]> => {
  assertValidId(adventureId, 'Adventure');
  const db = await getDatabase();
  return db.select<Session[]>(
    'SELECT * FROM sessions WHERE adventure_id = $1 ORDER BY created_at DESC',
    [adventureId],
  );
};
