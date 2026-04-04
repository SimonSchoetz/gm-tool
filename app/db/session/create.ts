import { getDatabase } from '../database';
import { generateId } from '../../util';
import { buildCreateQuery } from '../util';
import { sessionTable } from './schema';
import type { CreateSessionInput } from './types';

export const create = async (data: CreateSessionInput): Promise<string> => {
  const validated = sessionTable.createSchema.parse(data);

  const id = generateId();
  const db = await getDatabase();
  const { sql, values } = buildCreateQuery('sessions', id, validated);

  await db.execute(sql, values);
  return id;
};
