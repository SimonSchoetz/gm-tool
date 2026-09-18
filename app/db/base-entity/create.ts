import { entityTypeLabel, type BaseEntityType } from '@domain';
import { getDatabase } from '../database';
import {
  generateId,
  buildCreateQuery,
  generateDbTimestamps,
  assertValidId,
} from '../util';
import { getDateTimeString } from '@util';

export const create = async (
  entityType: BaseEntityType,
  adventureId: string,
): Promise<string> => {
  assertValidId(adventureId, 'adventure');

  const id = generateId();
  const { now, ...timestamps } = generateDbTimestamps();
  const name = `New ${entityTypeLabel(entityType)} ${getDateTimeString(now)}`;

  const { sql, values } = buildCreateQuery<{
    adventure_id: string;
    entity_type: BaseEntityType;
    name: string;
    created_at: string;
    updated_at: string;
  }>('base_entities', id, {
    adventure_id: adventureId,
    entity_type: entityType,
    name,
    ...timestamps,
  });

  const db = await getDatabase();
  await db.execute(sql, values);
  return id;
};
