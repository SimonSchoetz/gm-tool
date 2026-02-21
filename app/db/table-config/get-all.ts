import z from 'zod';
import { getDatabase } from '../database';
import { tableConfigTable } from './schema';
import { parseLayoutFromRow } from './parse-layout-row';
import type { TableConfig } from './types';

type TableConfigRow = z.infer<typeof tableConfigTable.zodSchema>;

export const getAll = async (): Promise<TableConfig[]> => {
  const db = await getDatabase();

  const rows = await db.select<TableConfigRow[]>(
    'SELECT * FROM table_config ORDER BY table_name ASC',
  );

  return rows.map((row) => ({
    ...row,
    layout: parseLayoutFromRow(row.layout),
  }));
};
