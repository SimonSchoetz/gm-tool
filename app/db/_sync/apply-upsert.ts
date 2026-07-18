import type Database from '@tauri-apps/plugin-sql';
import { getDatabase } from '../database';
import { SYNCED_TABLES } from './registry';

type ApplyResult = 'applied' | 'skipped';

const filterToWhitelist = (
  row: Record<string, unknown>,
  columns: string[],
): Record<string, unknown> => {
  const filtered: Record<string, unknown> = {};
  for (const column of columns) {
    if (column in row) {
      filtered[column] = row[column];
    }
  }
  return filtered;
};

const isLocalNewer = (
  localUpdatedAt: string,
  incomingUpdatedAt: string,
  force: boolean,
): boolean =>
  force
    ? localUpdatedAt > incomingUpdatedAt
    : localUpdatedAt >= incomingUpdatedAt;

const executeUpsert = async (
  db: Database,
  tableName: string,
  filtered: Record<string, unknown>,
): Promise<ApplyResult> => {
  const columns = Object.keys(filtered);
  const placeholders = columns.map((_, index) => `$${index + 1}`);
  const updateSet = columns
    .filter((column) => column !== 'id')
    .map((column) => `${column} = excluded.${column}`)
    .join(', ');
  const values = columns.map((column) => filtered[column]);

  // tableName is interpolated directly because SQL does not support parameterized
  // table names. It must only ever receive values from SYNCED_TABLES, which is a
  // fixed registry constant — never from user input (mirrors mention-search.ts).
  const sql = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders.join(', ')}) ON CONFLICT(id) DO UPDATE SET ${updateSet}`;

  try {
    await db.execute(sql, values);
    return 'applied';
  } catch {
    // FK parent absent or a NOT NULL column missing from the incoming row —
    // the deletion won, or the row is malformed for this schema version.
    return 'skipped';
  }
};

const applyTableConfigUpsert = async (
  db: Database,
  filtered: Record<string, unknown>,
  incomingId: string,
  incomingUpdatedAt: string,
  force: boolean,
): Promise<ApplyResult> => {
  const tableName = filtered.table_name;
  if (typeof tableName !== 'string' || tableName === '') return 'skipped';

  // table_config merges by table_name, not id: the same logical config row has
  // different ids on each device (seeded per device), so id-based union would
  // duplicate every list config on first sync.
  const localRows = await db.select<{ id: string; updated_at: string }[]>(
    'SELECT id, updated_at FROM table_config WHERE table_name = $1',
    [tableName],
  );
  if (localRows.length > 0) {
    const local = localRows[0];
    if (isLocalNewer(local.updated_at, incomingUpdatedAt, force))
      return 'skipped';

    if (local.id !== incomingId) {
      try {
        await db.execute('DELETE FROM table_config WHERE id = $1', [local.id]);
      } catch {
        return 'skipped';
      }
    }
  }

  return executeUpsert(db, 'table_config', filtered);
};

export const applyUpsert = async (
  tableName: string,
  row: Record<string, unknown>,
  force: boolean,
): Promise<ApplyResult> => {
  const entry = SYNCED_TABLES.find((table) => table.name === tableName);
  if (!entry) return 'skipped';

  const { id, updated_at: updatedAt } = row;
  if (
    typeof id !== 'string' ||
    id === '' ||
    typeof updatedAt !== 'string' ||
    updatedAt === ''
  ) {
    return 'skipped';
  }

  const filtered = filterToWhitelist(row, entry.columns);
  const db = await getDatabase();

  if (tableName === 'table_config') {
    return applyTableConfigUpsert(db, filtered, id, updatedAt, force);
  }

  const localRows = await db.select<{ updated_at: string }[]>(
    `SELECT updated_at FROM ${tableName} WHERE id = $1`,
    [id],
  );
  if (
    localRows.length > 0 &&
    isLocalNewer(localRows[0].updated_at, updatedAt, force)
  ) {
    return 'skipped';
  }

  return executeUpsert(db, tableName, filtered);
};
