// Node host — imported by vitePlugin.ts and by the test support in db/__tests__/support/; stands in for @tauri-apps/plugin-sql's Database over node:sqlite, so its importers run only under Node (Vite's config bundle, or a test under `// @vitest-environment node`). The folder has no index.ts; protocol.ts states why.
import { DatabaseSync, type SQLInputValue } from 'node:sqlite';
import type { QueryResult } from '@tauri-apps/plugin-sql';

// `path` makes a `SqliteDatabase` assignable to plugin-sql's `Database`, so callers pass it to `up(db)`, `runMigrations(db, …)` and `ensureColumn(db, …)` with no cast.
export type SqliteDatabase = {
  path: string;
  execute: (query: string, bindValues?: unknown[]) => Promise<QueryResult>;
  select: <T>(query: string, bindValues?: unknown[]) => Promise<T>;
  close: () => Promise<boolean>;
};

// Anything the body throws — an SQLite error, the statement guard — surfaces as a rejected promise, as with plugin-sql.
const settle = <T>(body: () => T): Promise<T> =>
  new Promise((resolve) => {
    resolve(body());
  });

// plugin-sql types bind values as `unknown[]`; the values db code passes are strings, numbers and `null`, which `SQLInputValue` covers.
const toSqlValues = (bindValues?: unknown[]) =>
  (bindValues ?? []) as SQLInputValue[];

export const openSqliteDatabase = (path: string): SqliteDatabase => {
  const database = new DatabaseSync(path);
  // Explicit rather than relying on node:sqlite's default, so the adapter keeps the foreign-key enforcement sqlx gives the app's connection.
  database.exec('PRAGMA foreign_keys = ON');

  // `prepare()` silently compiles only the first statement, so a query that still holds a `;` after one trailing one is trimmed is refused instead of losing its tail. `$N` becomes `?N`, which binds by number the way sqlx does.
  const prepare = (query: string) => {
    const statement = query.trimEnd().replace(/;$/, '');
    if (statement.includes(';')) {
      throw new Error(
        `Multi-statement SQL is not supported by prepare(): ${query}`,
      );
    }
    return database.prepare(statement.replace(/\$(\d+)/g, '?$1'));
  };

  return {
    path,
    execute: (query, bindValues) =>
      settle(() => {
        const values = toSqlValues(bindValues);
        if (values.length === 0) {
          database.exec(query);
          const counts =
            database
              .prepare(
                'SELECT changes() AS rowsAffected, last_insert_rowid() AS lastInsertId',
              )
              .get() ?? null;
          if (counts === null) {
            throw new Error('SELECT changes() returned no row');
          }
          return {
            rowsAffected: Number(counts.rowsAffected),
            lastInsertId: Number(counts.lastInsertId),
          };
        }
        const result = prepare(query).run(...values);
        return {
          rowsAffected: Number(result.changes),
          lastInsertId: Number(result.lastInsertRowid),
        };
      }),
    select: <T>(query: string, bindValues?: unknown[]) =>
      settle(() => {
        const rows = prepare(query).all(...toSqlValues(bindValues));
        // Rows are copied into plain objects, because node:sqlite returns them with a null prototype. plugin-sql's `select<T>` returns whatever the IPC call delivers as the caller-named `T` without checking it (app/node_modules/@tauri-apps/plugin-sql/dist-js/index.js:117-124), and the adapter does the same.
        return rows.map((row) => ({ ...row })) as T;
      }),
    close: () =>
      settle(() => {
        database.close();
        return true;
      }),
  };
};
