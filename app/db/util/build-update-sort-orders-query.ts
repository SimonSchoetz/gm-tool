type UpdateSortOrdersQuery = {
  sql: string;
  values: unknown[];
};

export type SortOrderEntry = { id: string; sort_order: number };

// One UPDATE for every entry, so an order is never stored half-written: SQLite runs a single statement in its own implicit transaction and backs out all of it on failure. Every listed row gets a fresh updated_at, which sync needs to carry the new position to a paired device.
export const buildUpdateSortOrdersQuery = (
  tableName: string,
  entries: SortOrderEntry[],
  updatedAt: string,
): UpdateSortOrdersQuery => {
  if (entries.length === 0) {
    throw new Error('At least one row is required');
  }

  const values: unknown[] = [];
  const bind = (value: unknown) => {
    values.push(value);
    return `$${values.length}`;
  };

  const cases = entries
    .map(({ id, sort_order }) => `WHEN ${bind(id)} THEN ${bind(sort_order)}`)
    .join(' ');
  const updatedAtPlaceholder = bind(updatedAt);
  const ids = entries.map(({ id }) => bind(id)).join(', ');

  // tableName is a literal at every caller (app/db/CLAUDE.md — Conventions, "Values are always bound").
  const sql = `UPDATE ${tableName} SET sort_order = CASE id ${cases} END, updated_at = ${updatedAtPlaceholder} WHERE id IN (${ids})`;
  return { sql, values };
};
