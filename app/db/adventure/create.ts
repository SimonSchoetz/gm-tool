import { getDatabase } from '../database';
import { generateId } from '../../util';
import { adventureTable } from './schema';
import type { CreateAdventureInput } from './types';

export const create = async (data: CreateAdventureInput): Promise<string> => {
  const validated = adventureTable.createSchema.parse(data);

  const id = generateId();

  const fieldsToInsert = {
    id,
    name: validated.name,
  };

  const columnNames = Object.keys(fieldsToInsert);
  const values = Object.values(fieldsToInsert);
  const paramIndex = columnNames.map((_, i) => `$${i + 1}`).join(', ');

  const db = await getDatabase();
  await db.execute(
    `INSERT INTO adventures (${columnNames.join(', ')}) VALUES (${paramIndex})`,
    values
  );
  return id;
};
