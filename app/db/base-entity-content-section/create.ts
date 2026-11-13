import { getDatabase } from '../database';
import {
  generateId,
  buildAppendQuery,
  generateDbTimestamps,
  assertValidId,
} from '../util';
import type { CreateBaseEntityContentSectionInput } from './types';

// Places the new section after the base entity's last one.
export const create = async (
  data: CreateBaseEntityContentSectionInput,
): Promise<string> => {
  assertValidId(data.base_entity_id, 'Base entity');

  const id = generateId();
  const { created_at, updated_at } = generateDbTimestamps();

  const { sql, values } = buildAppendQuery<{
    base_entity_id: string;
    type: string;
    created_at: string;
    updated_at: string;
    name?: string;
  }>(
    'base_entity_content_sections',
    id,
    {
      base_entity_id: data.base_entity_id,
      type: data.type,
      created_at,
      updated_at,
      ...(data.name !== undefined ? { name: data.name } : {}),
    },
    'base_entity_id',
  );

  const db = await getDatabase();
  await db.execute(sql, values);
  return id;
};
