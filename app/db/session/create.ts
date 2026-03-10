import { getDatabase } from '../database';
import { generateId } from '../../util';
import { sessionTable } from './schema';
import type { CreateSessionInput } from './types';

export const create = async (data: CreateSessionInput): Promise<string> => {
  const validated = sessionTable.createSchema.parse(data);

  const id = generateId();
  const db = await getDatabase();
  await db.execute(
    'INSERT INTO sessions (id, name, adventure_id) VALUES ($1, $2, $3)',
    [id, validated.name, validated.adventure_id],
  );
  return id;
};
