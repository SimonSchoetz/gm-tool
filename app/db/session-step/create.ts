import { getDatabase } from '../database';
import {
  generateId,
  buildCreateQuery,
  generateDbTimestamps,
  assertValidId,
} from '../util';
import type { CreateSessionStepInput } from './types';
export const create = async (data: CreateSessionStepInput): Promise<string> => {
  assertValidId(data.session_id, 'session');

  const id = generateId();
  const { created_at, updated_at } = generateDbTimestamps();

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-arguments -- explicit type argument triggers excess property checking; inference alone does not
  const { sql, values } = buildCreateQuery<{
    session_id: string;
    sort_order: number;
    created_at: string;
    updated_at: string;
  }>('session_steps', id, {
    session_id: data.session_id,
    sort_order: data.sort_order,
    created_at,
    updated_at,
    ...(data.default_step_key !== undefined
      ? { default_step_key: data.default_step_key }
      : {}),
    ...(data.name !== undefined ? { name: data.name } : {}),
  });

  const db = await getDatabase();
  await db.execute(sql, values);
  return id;
};
