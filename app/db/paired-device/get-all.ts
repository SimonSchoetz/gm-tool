import { getDatabase } from '../database';
import type { PairedDevice } from './types';

export const getAll = async (): Promise<PairedDevice[]> => {
  const db = await getDatabase();
  return db.select<PairedDevice[]>(
    'SELECT * FROM paired_devices ORDER BY created_at DESC',
  );
};
