import { getDatabase } from '../database';
import { generateId, buildCreateQuery } from '../util';
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
  const { sql, values } = buildCreateQuery('table_config', id, validated);

  const db = await getDatabase();
  await db.execute(sql, values);
  return id;
};
