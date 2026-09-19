import { getDatabase } from '../database';
import { assertValidId } from '../util';
import { parseLayoutFromRow } from './parse-layout-row';
import type { TableConfig, TableConfigRow } from './types';

export const get = async (id: string): Promise<TableConfig | null> => {
  assertValidId(id, 'table config');

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
