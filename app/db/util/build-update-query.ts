type UpdateQuery = {
  sql: string;
  values: unknown[];
};

export const buildUpdateQuery = (
  tableName: string,
  id: string,
  validated: Record<string, unknown>,
): UpdateQuery => {
  const fields: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  Object.entries(validated).forEach(([key, value]) => {
    if (value !== undefined) {
      fields.push(`${key} = $${paramIndex++}`);
      values.push(value);
    }
  });

  const updatedAt = new Date().toISOString();
  fields.push(`updated_at = $${paramIndex++}`);
  values.push(updatedAt);
  values.push(id);

  const sql = `UPDATE ${tableName} SET ${fields.join(', ')} WHERE id = $${paramIndex}`;

  return { sql, values };
};
