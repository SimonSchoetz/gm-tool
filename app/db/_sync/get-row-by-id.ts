import { getDatabase } from '../database';
import { SYNCED_TABLE_NAMES } from './registry';

export const getRowById = async (
  tableName: string,
  rowId: string,
): Promise<Record<string, unknown> | null> => {
  if (!SYNCED_TABLE_NAMES.includes(tableName)) {
    throw new Error(`Unknown synced table: ${tableName}`);
  }

  const db = await getDatabase();
  // tableName is interpolated directly because SQL does not support parameterized
  // table names. It must only ever receive values from SYNCED_TABLE_NAMES, which
  // is a fixed registry constant — never from user input (mirrors mention-search.ts).
  const rows = await db.select<Record<string, unknown>[]>(
    `SELECT * FROM ${tableName} WHERE id = $1`,
    [rowId],
  );
  return rows[0] ?? null;
};
