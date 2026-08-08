import { getDatabase } from '../database';
import {
  generateId,
  buildCreateQuery,
  generateDbTimestamps,
  assertValidId,
} from '../util';
import { getDateTimeString } from '@util';

export const create = async (adventure_id: string): Promise<string> => {
  assertValidId(adventure_id, 'adventure');

  const id = generateId();
  const { now, ...timestamps } = generateDbTimestamps();
  const name = `New Encounter ${getDateTimeString(now)}`;

  const { sql, values } = buildCreateQuery<{
    adventure_id: string;
    name: string;
    created_at: string;
    updated_at: string;
  }>('encounters', id, {
    adventure_id,
    name,
    ...timestamps,
  });

  const db = await getDatabase();
  await db.execute(sql, values);
  return id;
};
