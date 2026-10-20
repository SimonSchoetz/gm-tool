// Wraps `openSqliteDatabase(':memory:')` from `app/dev-data-server/sqliteDatabase.ts` — the stand-in for `@tauri-apps/plugin-sql`'s `Database` that `db/database.ts` loads, over an in-memory SQLite built by the app's own migrations — with a call counter and an injected failure; importers must run under `// @vitest-environment node`, because `node:sqlite` exists only in Node. How a db test wires it in is in `.claude/rules/db-unit-tests.md`.
import {
  openSqliteDatabase,
  type SqliteDatabase,
} from '../../../dev-data-server/sqliteDatabase';
import { migrations } from '@db/_migrations';

export type TestDatabase = SqliteDatabase & {
  callCount: () => number;
  failOnCall: (callNumber: number) => void;
};

export const openTestDatabase = (): TestDatabase => {
  const base = openSqliteDatabase(':memory:');

  let calls = 0;
  let failingCall: number | null = null;

  const startCall = () => {
    calls += 1;
    if (calls === failingCall) {
      failingCall = null;
      throw new Error('Injected failure');
    }
  };

  return {
    ...base,
    // Each guard is `async` so an injected failure thrown by `startCall` surfaces as a rejection, as an SQLite error does through the adapter.
    execute: async (query, bindValues) => {
      startCall();
      return base.execute(query, bindValues);
    },
    select: async <T>(query: string, bindValues?: unknown[]) => {
      startCall();
      return base.select<T>(query, bindValues);
    },
    callCount: () => calls,
    failOnCall: (callNumber) => {
      failingCall = callNumber;
    },
  };
};

// The `beforeFirstPending` step `runMigrations` requires, backing nothing up, for tests whose subject is not the backup.
export const skipBackup = (): Promise<void> => Promise.resolve();

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

// Leaves the database as an app version that predates `migrationId` left it: `applyMigrationsBefore`, plus a `_migrations` ledger recording each of those migrations at `appliedAt`, so `runMigrations` finds `migrationId` and every later migration pending. Returns the recorded ids in ascending order.
export const applyRecordedMigrationsBefore = async (
  db: TestDatabase,
  migrationId: string,
  appliedAt: string,
): Promise<string[]> => {
  await applyMigrationsBefore(db, migrationId);
  await db.execute(
    'CREATE TABLE _migrations (id TEXT PRIMARY KEY, applied_at TEXT NOT NULL)',
  );
  const recordedIds = migrations
    .map((migration) => migration.id)
    .filter((id) => id < migrationId);
  for (const id of recordedIds) {
    await db.execute(
      'INSERT INTO _migrations (id, applied_at) VALUES ($1, $2)',
      [id, appliedAt],
    );
  }
  return recordedIds;
};
