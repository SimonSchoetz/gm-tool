import { getDatabase } from '../database';
import { generateId } from '../../util';
import { sessionStepTable } from './schema';
import type { CreateSessionStepInput } from './types';

export const create = async (data: CreateSessionStepInput): Promise<string> => {
  const validated = sessionStepTable.createSchema.parse(data);

  const id = generateId();
  const db = await getDatabase();
  await db.execute(
    'INSERT INTO session_steps (id, session_id, sort_order, checked, name, content, default_step_key) VALUES ($1, $2, $3, $4, $5, $6, $7)',
    [
      id,
      validated.session_id,
      validated.sort_order,
      validated.checked,
      validated.name ?? null,
      validated.content ?? null,
      validated.default_step_key ?? null,
    ],
  );
  return id;
};
