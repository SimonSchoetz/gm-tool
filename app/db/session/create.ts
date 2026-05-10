import { getDatabase } from '../database';
import {
  generateId,
  buildCreateQuery,
  generateDbTimestamps,
  assertValidId,
} from '../util';

export const create = async (adventure_id: string): Promise<string> => {
  assertValidId(adventure_id, 'adventure');

  const id = generateId();
  const { created_at, updated_at } = generateDbTimestamps();

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-arguments -- explicit type argument triggers excess property checking; inference alone does not
  const { sql, values } = buildCreateQuery<{
    adventure_id: string;
    created_at: string;
    updated_at: string;
  }>('sessions', id, {
    adventure_id,
    created_at,
    updated_at,
  });

  const db = await getDatabase();
  await db.execute(sql, values);
  return id;
};
