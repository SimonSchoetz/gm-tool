import { getDatabase } from '../database';
import { generateId } from '../../util';
import type { Session } from './types';

export const create = async (session: Session): Promise<string> => {
  if (!session.title || session.title.trim() === '') {
    throw new Error('Session title is required');
  }

  const id = generateId();
  const db = await getDatabase();
  await db.execute(
    'INSERT INTO sessions (id, title, description, session_date, notes) VALUES ($1, $2, $3, $4, $5)',
    [
      id,
      session.title,
      session.description || null,
      session.session_date || null,
      session.notes || null,
    ]
  );
  return id;
};
