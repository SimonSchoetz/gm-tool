import { getDatabase } from '../database';
import { generateId } from '../../util';
import { tableConfigTable } from './schema';
import { tableLayoutSchema } from './layout-schema';
import type { CreateTableConfigInput } from './types';

export const create = async (data: CreateTableConfigInput): Promise<string> => {
  const layoutResult = tableLayoutSchema.safeParse(data.layout);
  if (!layoutResult.success) {
    throw new Error(`Invalid layout: ${layoutResult.error.message}`);
  }

  const validated = tableConfigTable.createSchema.parse({
    ...data,
    layout: JSON.stringify(layoutResult.data),
  });

  const id = generateId();

  const fieldsToInsert = {
    ...validated,
    id,
    layout: validated.layout,
  };

  const columnNames = Object.keys(fieldsToInsert);
  const values = Object.values(fieldsToInsert);
  const paramIndex = columnNames.map((_, i) => `$${i + 1}`).join(', ');

  const db = await getDatabase();
  await db.execute(
    `INSERT INTO table_config (${columnNames.join(', ')}) VALUES (${paramIndex})`,
    values,
  );
  return id;
};
