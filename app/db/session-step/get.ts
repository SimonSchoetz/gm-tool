import { getDatabase } from '../database';
import { assertValidId } from '../util';
import type { SessionStep } from './types';

export const get = async (id: string): Promise<SessionStep | null> => {
  assertValidId(id, 'SessionStep');
  const db = await getDatabase();
  const result = await db.select<SessionStep[]>(
    'SELECT * FROM session_steps WHERE id = $1',
    [id],
  );
  return result[0] ?? null;
};
