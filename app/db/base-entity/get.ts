import type { BaseEntityType } from '@domain';
import { getDatabase } from '../database';
import { assertValidId } from '../util';
import type { BaseEntity } from './types';

export const get = async (
  entityType: BaseEntityType,
  id: string,
): Promise<BaseEntity | null> => {
  assertValidId(id, 'Base entity');
  const db = await getDatabase();

  const result = await db.select<BaseEntity[]>(
    'SELECT * FROM base_entities WHERE id = $1 AND entity_type = $2',
    [id, entityType],
  );

  return result[0] ?? null;
};
