import { getDatabase } from '../database';
import type { Session } from './types';

export const create = async (session: Session): Promise<number> => {
  if (!session.title || session.title.trim() === '') {
    throw new Error('Session title is required');
  }

  const db = await getDatabase();
  const result = await db.execute(
    'INSERT INTO sessions (title, description, session_date, notes) VALUES ($1, $2, $3, $4)',
    [
      session.title,
      session.description || null,
      session.session_date || null,
      session.notes || null,
    ]
  );
  return result.lastInsertId;
};
