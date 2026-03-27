import { getDatabase } from '../database';
import { generateId } from '../../util';
import { sessionStepTable } from './schema';
import type { CreateSessionStepInput } from './types';

export const create = async (data: CreateSessionStepInput): Promise<string> => {
  const validated = sessionStepTable.createSchema.parse(data);

  const id = generateId();
  const db = await getDatabase();

  await db.execute(
    'INSERT INTO session_steps (id, session_id, sort_order, checked) VALUES ($1, $2, $3, $4)',
    [id, validated.session_id, validated.sort_order, validated.checked],
  );
  return id;
};
