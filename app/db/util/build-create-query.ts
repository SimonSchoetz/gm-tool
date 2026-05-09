type CreateQuery = {
  sql: string;
  values: unknown[];
};

/* eslint-disable @typescript-eslint/no-unnecessary-type-parameters */
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

  const sql = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders.join(', ')})`;
  return { sql, values };
};
