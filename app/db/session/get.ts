import { getDatabase } from '../database';
import type { Session } from './types';

export const get = async (id: string): Promise<Session | null> => {
  if (!id || typeof id !== 'string' || id.trim() === '') {
    throw new Error('Valid session ID is required');
  }

  const db = await getDatabase();
  const sessions = await db.select<Session[]>(
    'SELECT * FROM sessions WHERE id = $1',
    [id]
  );
  return sessions[0] || null;
};
