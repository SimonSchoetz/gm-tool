import { getDatabase } from '../database';
import type { TableConfig } from './types';

export const getAll = async (): Promise<TableConfig[]> => {
  const db = await getDatabase();

  const data = await db.select<TableConfig[]>(
    'SELECT * FROM table_config ORDER BY display_name ASC'
  );

  return data;
};
