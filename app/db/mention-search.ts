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
  const db = await getDatabase();

  // tableName is interpolated directly because SQL does not support parameterized
  // table names. It must only ever receive values from table_config.table_name,
  // which is seeded by the application itself — never from user input.
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
