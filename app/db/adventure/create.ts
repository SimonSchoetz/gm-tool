import { getDatabase } from '../database';
import { generateId } from '../../util';
import { adventureTable } from './schema';
import type { CreateAdventureInput } from './types';

export const create = async (data: CreateAdventureInput): Promise<string> => {
  const validated = adventureTable.createSchema.parse(data);

  const id = generateId();
  const db = await getDatabase();
  await db.execute(
    'INSERT INTO adventures (id, title, description) VALUES ($1, $2, $3)',
    [id, validated.title, validated.description ?? null]
  );
  return id;
};
