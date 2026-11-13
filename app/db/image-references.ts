import { getDatabase } from './database';
import { SYNCED_TABLES } from './_sync';

// Every column that names an image, read from the sync registry's foreign keys, so a table that gains an image column is checked without a change here.
const imageColumns = SYNCED_TABLES.flatMap((table) =>
  table.parents
    .filter((parent) => parent.table === 'images')
    .map((parent) => ({ table: table.name, column: parent.column })),
);

export const isImageReferenced = async (imageId: string): Promise<boolean> => {
  const db = await getDatabase();
  // The table and column names come from SYNCED_TABLES, a fixed registry constant.
  const sql = imageColumns
    .map(({ table, column }) => `SELECT 1 FROM ${table} WHERE ${column} = $1`)
    .join(' UNION ALL ');
  const rows = await db.select<unknown[]>(sql, [imageId]);
  return rows.length > 0;
};
