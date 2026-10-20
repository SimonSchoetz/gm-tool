// @vitest-environment node
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { openSqliteDatabase } from '../sqliteDatabase';
import { createTempDirectory } from './support/tempDirectory';

const MULTI_STATEMENT_ERROR =
  'Multi-statement SQL is not supported by prepare():';

describe('openSqliteDatabase', () => {
  it('binds $N placeholders by number in both execute and select', async () => {
    const db = openSqliteDatabase(':memory:');
    await db.execute('CREATE TABLE t (a TEXT, b TEXT)');

    await db.execute('INSERT INTO t (a, b) VALUES ($2, $1)', [
      'for-b',
      'for-a',
    ]);

    expect(await db.select('SELECT a, b FROM t')).toEqual([
      { a: 'for-a', b: 'for-b' },
    ]);
    expect(
      await db.select('SELECT a FROM t WHERE b = $2 AND a = $1', [
        'for-a',
        'for-b',
      ]),
    ).toEqual([{ a: 'for-a' }]);
  });

  it('refuses a multi-statement string that prepare() would truncate but accepts one trailing semicolon', async () => {
    const db = openSqliteDatabase(':memory:');
    await db.execute('CREATE TABLE t (a TEXT)');

    await expect(
      db.execute(
        'INSERT INTO t (a) VALUES ($1); INSERT INTO t (a) VALUES ($1)',
        ['x'],
      ),
    ).rejects.toThrow(MULTI_STATEMENT_ERROR);
    await expect(db.select('SELECT a FROM t; SELECT a FROM t')).rejects.toThrow(
      MULTI_STATEMENT_ERROR,
    );
    await db.execute('INSERT INTO t (a) VALUES ($1);', ['y']);
    expect(await db.select('SELECT a FROM t;')).toEqual([{ a: 'y' }]);
  });

  it('runs every statement of a multi-statement string that has no bind values', async () => {
    const db = openSqliteDatabase(':memory:');

    await db.execute('CREATE TABLE a (x); CREATE TABLE b (y);');

    const tables = await db.select<{ name: string }[]>(
      "SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name",
    );
    expect(tables.map((table) => table.name)).toEqual(['a', 'b']);
  });

  it('enforces foreign keys', async () => {
    const db = openSqliteDatabase(':memory:');
    await db.execute('CREATE TABLE parent (id TEXT PRIMARY KEY)');
    await db.execute(
      'CREATE TABLE child (id TEXT PRIMARY KEY, parent_id TEXT NOT NULL REFERENCES parent(id))',
    );

    await expect(
      db.execute('INSERT INTO child (id, parent_id) VALUES ($1, $2)', [
        'child-1',
        'missing-parent',
      ]),
    ).rejects.toThrow('FOREIGN KEY constraint failed');
  });

  it('returns rows as plain objects', async () => {
    const db = openSqliteDatabase(':memory:');

    const rows = await db.select<object[]>('SELECT 1 AS x');

    expect(Object.getPrototypeOf(rows[0])).toBe(Object.prototype);
  });

  describe('on a file path', () => {
    let temp: ReturnType<typeof createTempDirectory> | null = null;

    afterEach(() => {
      temp?.remove();
      temp = null;
    });

    it('persists rows written and closed, so a second open of the same path reads them', async () => {
      temp = createTempDirectory();
      const file = join(temp.dir, 'adapter.db');
      const writer = openSqliteDatabase(file);
      await writer.execute('CREATE TABLE t (a TEXT)');
      await writer.execute('INSERT INTO t (a) VALUES ($1)', ['persisted']);
      await writer.close();

      const reader = openSqliteDatabase(file);

      expect(reader.path).toBe(file);
      expect(await reader.select('SELECT a FROM t')).toEqual([
        { a: 'persisted' },
      ]);
      await reader.close();
    });
  });
});
