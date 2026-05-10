type UpdateQuery = {
  sql: string;
  values: unknown[];
};

// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters -- T appears only once, but keeping the generic lets callers pass an explicit type argument to activate excess property checking on the UPDATE data object
export const buildUpdateQuery = <T extends Record<string, unknown>>(
  tableName: string,
  id: string,
  validated: T,
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
