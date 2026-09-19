// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { openTestDatabase } from '@db/__tests__/support/sqlite-test-database';
import { ensureColumn } from '../ensure-column';

const ADD_LABEL_SQL = 'ALTER TABLE things ADD COLUMN label TEXT';

const readColumnNames = async (
  db: ReturnType<typeof openTestDatabase>,
): Promise<string[]> =>
  (await db.select<{ name: string }[]>('PRAGMA table_info(things)')).map(
    (column) => column.name,
  );

describe('ensureColumn', () => {
  it('adds the column when the table does not have it', async () => {
    const db = openTestDatabase();
    await db.execute('CREATE TABLE things (id TEXT PRIMARY KEY)');

    await ensureColumn(db, 'things', 'label', ADD_LABEL_SQL);

    expect(await readColumnNames(db)).toEqual(['id', 'label']);
  });

  it('resolves and leaves the table unchanged when the column already exists', async () => {
    const db = openTestDatabase();
    await db.execute('CREATE TABLE things (id TEXT PRIMARY KEY, label TEXT)');

    await ensureColumn(db, 'things', 'label', ADD_LABEL_SQL);

    expect(await readColumnNames(db)).toEqual(['id', 'label']);
  });
});
