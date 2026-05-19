import { getDatabase } from '../database';
import { assertValidId } from '../util';
import type { Session } from './types';

export const get = async (id: string): Promise<Session | null> => {
  assertValidId(id, 'session');
  const db = await getDatabase();
  const sessions = await db.select<Session[]>(
    'SELECT * FROM sessions WHERE id = $1',
    [id],
  );
  return sessions[0] ?? null;
};
