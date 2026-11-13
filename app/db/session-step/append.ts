import { getDatabase } from '../database';
import {
  generateId,
  buildAppendQuery,
  generateDbTimestamps,
  assertValidId,
} from '../util';
import type { AppendSessionStepInput } from './types';

// Places the new step after the session's last one.
export const append = async (data: AppendSessionStepInput): Promise<string> => {
  assertValidId(data.session_id, 'session');

  const id = generateId();
  const { created_at, updated_at } = generateDbTimestamps();

  const { sql, values } = buildAppendQuery<{
    session_id: string;
    created_at: string;
    updated_at: string;
    name?: string;
  }>(
    'session_steps',
    id,
    {
      session_id: data.session_id,
      created_at,
      updated_at,
      ...(data.name !== undefined ? { name: data.name } : {}),
    },
    'session_id',
  );

  const db = await getDatabase();
  await db.execute(sql, values);
  return id;
};
