import { getDatabase } from '../database';
import { assertValidId } from '../util';
import type { PairedDevice } from './types';

export const get = async (id: string): Promise<PairedDevice | null> => {
  assertValidId(id, 'paired device');

  const db = await getDatabase();
  const result = await db.select<PairedDevice[]>(
    'SELECT * FROM paired_devices WHERE id = $1',
    [id],
  );

  return result.length > 0 ? result[0] : null;
};
