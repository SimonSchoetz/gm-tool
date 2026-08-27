import type Database from '@tauri-apps/plugin-sql';

// table is interpolated directly because SQL does not support parameterized identifiers (PRAGMA table_info takes a bare table name) — callers are migration files, which only ever pass a fixed literal, never user input (mirrors backfill_sync_changes.ts).
export const ensureColumn = async (
  db: Database,
  table: string,
  column: string,
  alterSql: string,
): Promise<void> => {
  const columns = await db.select<{ name: string }[]>(
    `PRAGMA table_info(${table})`,
  );
  const columnExists = columns.some((existing) => existing.name === column);
  if (columnExists) return;

  await db.execute(alterSql);
};
