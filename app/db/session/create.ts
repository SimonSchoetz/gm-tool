import { getDatabase } from '../database';
import { generateId } from '../../util';
import { createSessionSchema } from './schema';
import type { CreateSessionInput } from './types';

export const create = async (data: CreateSessionInput): Promise<string> => {
  const validated = createSessionSchema.parse(data);

  const id = generateId();
  const db = await getDatabase();
  await db.execute(
    'INSERT INTO sessions (id, title, description, session_date, notes) VALUES ($1, $2, $3, $4, $5)',
    [
      id,
      validated.title,
      validated.description ?? null,
      validated.session_date ?? null,
      validated.notes ?? null,
    ]
  );
  return id;
};
