// @vitest-environment node
import { describe, it, expect } from 'vitest';
import {
  applyMigrationsBefore,
  openTestDatabase,
} from '@db/__tests__/support/sqlite-test-database';

const MULTI_STATEMENT_ERROR =
  'Multi-statement SQL is not supported by prepare():';

describe('openTestDatabase', () => {
  it('binds $N placeholders by number in both execute and select', async () => {
    const db = openTestDatabase();
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
    const db = openTestDatabase();
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
    const db = openTestDatabase();

    await db.execute('CREATE TABLE a (x); CREATE TABLE b (y);');

    const tables = await db.select<{ name: string }[]>(
      "SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name",
    );
    expect(tables.map((table) => table.name)).toEqual(['a', 'b']);
  });

  it('enforces foreign keys', async () => {
    const db = openTestDatabase();
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
    const db = openTestDatabase();

    const rows = await db.select<object[]>('SELECT 1 AS x');

    expect(Object.getPrototypeOf(rows[0])).toBe(Object.prototype);
  });

  it('fails only the armed call and counts select calls', async () => {
    const db = openTestDatabase();
    db.failOnCall(2);

    await db.execute('CREATE TABLE t (x TEXT)');
    await expect(
      db.execute('INSERT INTO t (x) VALUES ($1)', ['a']),
    ).rejects.toThrow('Injected failure');
    const rows = await db.select<{ x: string }[]>('SELECT x FROM t');

    expect(rows).toEqual([]);
    expect(db.callCount()).toBe(3);
  });
});

describe('applyMigrationsBefore', () => {
  it('applies the migrations before the given id, none of the later ones, and no ledger', async () => {
    const db = openTestDatabase();

    await applyMigrationsBefore(db, '1789743068849');

    const baseEntityColumns = await db.select<{ name: string }[]>(
      'PRAGMA table_info(base_entities)',
    );
    expect(baseEntityColumns.map((column) => column.name)).toContain('summary');
    const laterTables = await db.select<{ name: string }[]>(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name IN ('base_entity_content_sections', '_migrations')",
    );
    expect(laterTables).toEqual([]);
  });
});
