import { getDatabase } from '../database';
import { generateId, buildCreateQuery } from '../util';
import { adventureTable } from './schema';
import type { CreateAdventureInput } from './types';

export const create = async (data: CreateAdventureInput): Promise<string> => {
  const validated = adventureTable.createSchema.parse(data);

  const id = generateId();
  const { sql, values } = buildCreateQuery('adventures', id, validated);

  const db = await getDatabase();
  await db.execute(sql, values);
  return id;
};
