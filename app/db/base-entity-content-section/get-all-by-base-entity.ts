import { getDatabase } from '../database';
import { assertValidId } from '../util';
import type { BaseEntityContentSection } from './types';

export const getAllByBaseEntity = async (
  baseEntityId: string,
): Promise<BaseEntityContentSection[]> => {
  assertValidId(baseEntityId, 'Base entity');
  const db = await getDatabase();
  return db.select<BaseEntityContentSection[]>(
    'SELECT * FROM base_entity_content_sections WHERE base_entity_id = $1 ORDER BY sort_order ASC',
    [baseEntityId],
  );
};
