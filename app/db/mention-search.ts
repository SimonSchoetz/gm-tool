import { isEntityType } from '@domain/entities';
import { getDatabase } from './database';

type MentionSearchRow = {
  id: string;
  name: string;
  updated_at: string;
};

export const searchByName = async (
  tableName: string,
  query: string,
  adventureId: string | null,
): Promise<MentionSearchRow[]> => {
  if (!isEntityType(tableName)) return [];

  const db = await getDatabase();

  // tableName is interpolated directly because SQL does not support parameterized table names. The isEntityType guard above is what makes that safe — table_config.table_name is writable by any paired peer over sync, so no caller can be assumed to have validated it.
  if (adventureId !== null) {
    return db.select<MentionSearchRow[]>(
      `SELECT id, name, updated_at FROM ${tableName} WHERE name LIKE $1 AND adventure_id = $2 ORDER BY updated_at DESC`,
      [`%${query}%`, adventureId],
    );
  }

  return db.select<MentionSearchRow[]>(
    `SELECT id, name, updated_at FROM ${tableName} WHERE name LIKE $1 ORDER BY updated_at DESC`,
    [`%${query}%`],
  );
};

export const getById = async (
  tableName: string,
  id: string,
): Promise<MentionSearchRow | null> => {
  if (!isEntityType(tableName)) return null;

  const db = await getDatabase();

  // tableName is interpolated directly because SQL does not support parameterized table names. The isEntityType guard above is what makes that safe — callers are not assumed to have validated it.
  const rows = await db.select<MentionSearchRow[]>(
    `SELECT id, name, updated_at FROM ${tableName} WHERE id = $1`,
    [id],
  );

  return rows[0] ?? null;
};
