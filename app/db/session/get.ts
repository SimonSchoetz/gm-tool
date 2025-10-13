import { getDatabase } from '../database';
import type { Session } from './types';

export const get = async (id: number): Promise<Session | null> => {
  if (!id || id <= 0) {
    throw new Error('Valid session ID is required');
  }

  const db = await getDatabase();
  const sessions = await db.select<Session[]>(
    'SELECT * FROM sessions WHERE id = $1',
    [id]
  );
  return sessions[0] || null;
};
