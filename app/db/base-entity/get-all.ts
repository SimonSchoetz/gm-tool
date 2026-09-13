import type { BaseEntityType } from '@domain';
import { getDatabase } from '../database';
import { assertValidId } from '../util';
import type { BaseEntity } from './types';

export const getAll = async (
  entityType: BaseEntityType,
  adventureId: string,
): Promise<BaseEntity[]> => {
  assertValidId(adventureId, 'Adventure');
  const db = await getDatabase();

  const data = await db.select<BaseEntity[]>(
    'SELECT * FROM base_entities WHERE adventure_id = $1 AND entity_type = $2 ORDER BY created_at DESC',
    [adventureId, entityType],
  );

  return data;
};
