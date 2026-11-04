type CreateManyQuery = {
  sql: string;
  values: unknown[];
};

/* eslint-disable @typescript-eslint/no-unnecessary-type-parameters -- T appears only once, but callers supply an explicit type argument to activate excess property checking on the INSERT data objects */
export const buildCreateManyQuery = <
  T extends Record<string, string | number | null>,
>(
  // eslint-disable-next-line local/no-constant-argument -- a db/util query builder that takes the table name like its siblings buildCreateQuery and buildUpdateQuery; encounter-queue-item/create-many.ts is its only caller today
  tableName: string,
  rows: { id: string; data: T }[],
): CreateManyQuery => {
  if (rows.length === 0) {
    throw new Error('At least one row is required');
  }

  const columns = Object.keys(rows[0].data);
  const values: unknown[] = [];
  const tuples = rows.map(({ id, data }) => {
    const keys = Object.keys(data);
    if (keys.join() !== columns.join()) {
      throw new Error('Every row must have the same keys in the same order');
    }
    const placeholders = [id, ...Object.values(data)].map((value) => {
      values.push(value);
      return `$${values.length}`;
    });
    return `(${placeholders.join(', ')})`;
  });

  // tableName is a literal at every caller, and the keys of each row's data are the table's columns, typed by its row shape at each caller (app/db/CLAUDE.md — Conventions, "Values are always bound").
  const sql = `INSERT INTO ${tableName} (id, ${columns.join(', ')}) VALUES ${tuples.join(', ')}`;
  return { sql, values };
};
