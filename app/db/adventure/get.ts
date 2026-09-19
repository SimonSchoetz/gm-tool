import { getDatabase } from '../database';
import { assertValidId } from '../util';
import type { Adventure } from './types';

export const get = async (id: string): Promise<Adventure | null> => {
  assertValidId(id, 'adventure');

  const db = await getDatabase();
  const result = await db.select<Adventure[]>(
    'SELECT * FROM adventures WHERE id = $1',
    [id],
  );

  return result.length > 0 ? result[0] : null;
};
