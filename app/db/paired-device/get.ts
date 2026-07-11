import { getDatabase } from '../database';
import type { PairedDevice } from './types';

export const get = async (id: string): Promise<PairedDevice | null> => {
  if (!id || typeof id !== 'string' || id.trim() === '') {
    throw new Error('Valid paired device ID is required');
  }

  const db = await getDatabase();
  const result = await db.select<PairedDevice[]>(
    'SELECT * FROM paired_devices WHERE id = $1',
    [id],
  );

  return result.length > 0 ? result[0] : null;
};
