import { getDatabase } from '../database';
import type { Session } from './types';

export const update = async (
  id: string,
  session: Partial<Session>
): Promise<void> => {
  if (!id || typeof id !== 'string' || id.trim() === '') {
    throw new Error('Valid session ID is required');
  }

  if (session.title !== undefined && session.title.trim() === '') {
    throw new Error('Session title cannot be empty');
  }

  const db = await getDatabase();
  const fields: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (session.title !== undefined) {
    fields.push(`title = $${paramIndex++}`);
    values.push(session.title);
  }
  if (session.description !== undefined) {
    fields.push(`description = $${paramIndex++}`);
    values.push(session.description);
  }
  if (session.session_date !== undefined) {
    fields.push(`session_date = $${paramIndex++}`);
    values.push(session.session_date);
  }
  if (session.notes !== undefined) {
    fields.push(`notes = $${paramIndex++}`);
    values.push(session.notes);
  }

  fields.push('updated_at = CURRENT_TIMESTAMP');
  values.push(id);

  await db.execute(
    `UPDATE sessions SET ${fields.join(', ')} WHERE id = $${paramIndex}`,
    values
  );
};
