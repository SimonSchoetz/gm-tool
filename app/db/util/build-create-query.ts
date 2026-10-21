type CreateQuery = {
  sql: string;
  values: unknown[];
};

/* eslint-disable @typescript-eslint/no-unnecessary-type-parameters -- T appears only once, but callers supply an explicit type argument to activate excess property checking on the INSERT data object */
export const buildCreateQuery = <
  T extends Record<string, string | number | null>,
>(
  tableName: string,
  id: string,
  data: T,
): CreateQuery => {
  const columns: string[] = ['id'];
  const placeholders: string[] = ['$1'];
  const values: unknown[] = [id];
  let paramIndex = 2;

  Object.entries(data).forEach(([key, value]) => {
    columns.push(key);
    placeholders.push(`$${paramIndex++}`);
    values.push(value);
  });

  // tableName is a literal at every caller, and the keys of data are the table's columns, typed by its row shape at each caller (app/db/CLAUDE.md — Conventions, "Values are always bound").
  const sql = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders.join(', ')})`;
  return { sql, values };
};
