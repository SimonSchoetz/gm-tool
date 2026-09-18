import { getDatabase } from '../database';
import {
  generateId,
  buildCreateQuery,
  generateDbTimestamps,
  assertValidId,
} from '../util';
import type { CreateBaseEntityContentSectionInput } from './types';

export const create = async (
  data: CreateBaseEntityContentSectionInput,
): Promise<string> => {
  assertValidId(data.base_entity_id, 'Base entity');

  const id = generateId();
  const { created_at, updated_at } = generateDbTimestamps();

  const { sql, values } = buildCreateQuery<{
    base_entity_id: string;
    type: string;
    sort_order: number;
    created_at: string;
    updated_at: string;
  }>('base_entity_content_sections', id, {
    base_entity_id: data.base_entity_id,
    type: data.type,
    sort_order: data.sort_order,
    created_at,
    updated_at,
    ...(data.name !== undefined ? { name: data.name } : {}),
  });

  const db = await getDatabase();
  await db.execute(sql, values);
  return id;
};
