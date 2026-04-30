import { getDatabase } from '../database';
import { generateId, buildCreateQuery } from '../util';
import { sessionStepTable } from './schema';
import type { CreateSessionStepInput } from './types';

export const create = async (data: CreateSessionStepInput): Promise<string> => {
  const validated = sessionStepTable.createSchema.parse(data);

  const id = generateId();
  const db = await getDatabase();
  const { sql, values } = buildCreateQuery('session_steps', id, validated);

  await db.execute(sql, values);
  return id;
};
