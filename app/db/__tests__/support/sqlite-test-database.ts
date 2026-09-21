// Stands in for `@tauri-apps/plugin-sql`'s `Database`, which `db/database.ts` loads, with an in-memory SQLite that behaves like the app's sqlx connection and is built by the app's own migrations; importers must run under `// @vitest-environment node`, because `node:sqlite` exists only in Node. How a db test wires it in is in `.claude/rules/db-unit-tests.md`.
import { DatabaseSync, type SQLInputValue } from 'node:sqlite';
import type { QueryResult } from '@tauri-apps/plugin-sql';
import { migrations } from '@db/_migrations';

// `path` makes a `TestDatabase` assignable to plugin-sql's `Database`, so tests pass it to `up(db)`, `runMigrations(db)` and `ensureColumn(db, …)` with no cast.
export type TestDatabase = {
  path: string;
  execute: (query: string, bindValues?: unknown[]) => Promise<QueryResult>;
  select: <T>(query: string, bindValues?: unknown[]) => Promise<T>;
  close: () => Promise<boolean>;
  callCount: () => number;
  failOnCall: (callNumber: number) => void;
};

// Anything the body throws — an SQLite error, the statement guard, an injected failure — surfaces as a rejected promise, as with plugin-sql.
const settle = <T>(body: () => T): Promise<T> =>
  new Promise((resolve) => {
    resolve(body());
  });

export const openTestDatabase = (): TestDatabase => {
  const database = new DatabaseSync(':memory:');
  // Explicit rather than relying on node:sqlite's default, so the harness keeps the foreign-key enforcement sqlx gives the app's connection.
  database.exec('PRAGMA foreign_keys = ON');

  let calls = 0;
  let failingCall: number | null = null;

  const startCall = () => {
    calls += 1;
    if (calls === failingCall) {
      failingCall = null;
      throw new Error('Injected failure');
    }
  };

  // plugin-sql types bind values as `unknown[]`; the values db code passes are strings, numbers and `null`, which `SQLInputValue` covers.
  const toSqlValues = (bindValues?: unknown[]) =>
    (bindValues ?? []) as SQLInputValue[];

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
    path: ':memory:',
    execute: (query, bindValues) =>
      settle(() => {
        startCall();
        const values = toSqlValues(bindValues);
        if (values.length === 0) {
          database.exec(query);
          const { rowsAffected, lastInsertId } = database
            .prepare(
              'SELECT changes() AS rowsAffected, last_insert_rowid() AS lastInsertId',
            )
            .get() as { rowsAffected: number; lastInsertId: number };
          return { rowsAffected, lastInsertId };
        }
        const result = prepare(query).run(...values);
        return {
          rowsAffected: Number(result.changes),
          lastInsertId: Number(result.lastInsertRowid),
        };
      }),
    select: <T>(query: string, bindValues?: unknown[]) =>
      settle(() => {
        startCall();
        const rows = prepare(query).all(...toSqlValues(bindValues));
        // Rows are copied into plain objects, because node:sqlite returns them with a null prototype. plugin-sql's `select<T>` returns whatever the IPC call delivers as the caller-named `T` without checking it (app/node_modules/@tauri-apps/plugin-sql/dist-js/index.js:117-124), and the adapter does the same.
        return rows.map((row) => ({ ...row })) as T;
      }),
    close: () =>
      settle(() => {
        database.close();
        return true;
      }),
    callCount: () => calls,
    failOnCall: (callNumber) => {
      failingCall = callNumber;
    },
  };
};

// Runs every migration that sorts before `migrationId` and writes no `_migrations` ledger rows, so a migration test can seed data in the schema that existed just before the migration under test. The string comparison is correct because the ids are same-length `Date.now()` timestamps kept in ascending array order.
export const applyMigrationsBefore = async (
  db: TestDatabase,
  migrationId: string,
): Promise<void> => {
  for (const migration of migrations) {
    if (migration.id < migrationId) {
      await migration.up(db);
    }
  }
};
