type CreateQuery = {
  sql: string;
  values: unknown[];
};

export const buildCreateQuery = (
  tableName: string,
  id: string,
  validated: Record<string, unknown>
): CreateQuery => {
  const columns: string[] = ['id'];
  const placeholders: string[] = ['$1'];
  const values: unknown[] = [id];
  let paramIndex = 2;

  Object.entries(validated).forEach(([key, value]) => {
    if (value !== undefined) {
      columns.push(key);
      placeholders.push(`$${paramIndex++}`);
      values.push(value);
    }
  });

  const sql = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders.join(', ')})`;
  return { sql, values };
};
