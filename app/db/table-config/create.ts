import { getDatabase } from '../database';
import { generateId, buildCreateQuery, generateDbTimestamps } from '../util';
import { tableLayoutSchema } from './layout-schema';
import type { CreateTableConfigInput } from './types';

export const create = async (data: CreateTableConfigInput): Promise<string> => {
  const layoutResult = tableLayoutSchema.safeParse(data.layout);
  if (!layoutResult.success) {
    throw new Error(`Invalid layout: ${layoutResult.error.message}`);
  }

  const id = generateId();
  const { created_at, updated_at } = generateDbTimestamps();

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-arguments
  const { sql, values } = buildCreateQuery<{
    table_name: string;
    color: string;
    layout: string;
    created_at: string;
    updated_at: string;
  }>('table_config', id, {
    table_name: data.table_name,
    color: data.color,
    layout: JSON.stringify(layoutResult.data),
    created_at,
    updated_at,
    ...(data.tagging_enabled !== undefined
      ? { tagging_enabled: data.tagging_enabled }
      : {}),
    ...(data.scope !== undefined ? { scope: data.scope } : {}),
  });

  const db = await getDatabase();
  await db.execute(sql, values);
  return id;
};
