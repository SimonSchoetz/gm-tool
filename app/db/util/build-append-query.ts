type AppendQuery = {
  sql: string;
  values: unknown[];
};

// One INSERT that reads the next position itself, so two appends to one parent cannot both read the same highest sort_order and store the same position. The new row goes one past the highest sort_order among the rows sharing its scopeColumn value, or to 0 when it is the first.
export const buildAppendQuery = <
  T extends Record<string, string | number | null>,
>(
  tableName: string,
  id: string,
  data: T,
  scopeColumn: keyof T & string,
): AppendQuery => {
  const columns: string[] = ['id'];
  const values: unknown[] = [id];

  Object.entries(data).forEach(([key, value]) => {
    columns.push(key);
    values.push(value);
  });

  const placeholders = values.map((_, index) => `$${index + 1}`);
  const scopePlaceholder = `$${columns.indexOf(scopeColumn) + 1}`;

  // tableName is a literal at every caller, and the keys of data, scopeColumn among them, are the table's columns, typed by its row shape at each caller (app/db/CLAUDE.md — Conventions, "Values are always bound").
  const sql = `INSERT INTO ${tableName} (${columns.join(', ')}, sort_order) SELECT ${placeholders.join(', ')}, COALESCE(MAX(sort_order), -1) + 1 FROM ${tableName} WHERE ${scopeColumn} = ${scopePlaceholder}`;
  return { sql, values };
};
