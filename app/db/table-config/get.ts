import z from 'zod';
import { getDatabase } from '../database';
import { tableConfigTable } from './schema';
import { parseLayoutFromRow } from './parse-layout-row';
import type { TableConfig } from './types';

type TableConfigRow = z.infer<typeof tableConfigTable.zodSchema>;

export const get = async (id: string): Promise<TableConfig | null> => {
  if (!id || typeof id !== 'string' || id.trim() === '') {
    throw new Error('Valid table config ID is required');
  }

  const db = await getDatabase();
  const result = await db.select<TableConfigRow[]>(
    'SELECT * FROM table_config WHERE id = $1',
    [id],
  );

  if (result.length === 0) return null;

  const row = result[0];
  return {
    ...row,
    layout: parseLayoutFromRow(row.layout),
  };
};
