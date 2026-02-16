import { getDatabase } from '../database';
import type { TableConfig } from './types';

export const get = async (id: string): Promise<TableConfig | null> => {
  if (!id || typeof id !== 'string' || id.trim() === '') {
    throw new Error('Valid table config ID is required');
  }

  const db = await getDatabase();
  const result = await db.select<TableConfig[]>(
    'SELECT * FROM table_config WHERE id = $1',
    [id]
  );

  return result.length > 0 ? result[0] : null;
};
