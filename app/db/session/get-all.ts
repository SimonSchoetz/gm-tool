import { getDatabase } from '../database';
import type { Session } from './types';

/**
 * todo: pagination
 */
export const getAll = async (): Promise<Session[]> => {
  const db = await getDatabase();
  return await db.select<Session[]>(
    'SELECT * FROM sessions ORDER BY created_at DESC'
  );
};
