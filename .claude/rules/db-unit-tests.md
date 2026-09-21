---
paths: ["app/db/**/__tests__/**", "db/**/__tests__/**"]
---

# Unit tests under `db/`

A test of a function that runs SQL executes that SQL against the in-memory SQLite database that `app/db/__tests__/support/sqlite-test-database.ts` provides in place of `plugin-sql`, and asserts the rows the function leaves and the values it returns — never the SQL text it sent, and never a mocked `select` or `execute`. An assertion that rows are absent — after a delete, or after a write that must leave none — reads them from the test's own database, through `(await getDatabase()).select(...)` or a support helper that runs one, never through a module's reader: a reader that fails and returns nothing satisfies it too, as `expect(await getAll()).toEqual([])` does when `getAll` returns `[]` regardless. An assertion that a row or value is present may read back through the module's own reader or through the same raw select. A test of a pure TypeScript unit (a query builder, validation, a schema helper) needs no database and none of what follows. The engine behind that database is Node's bundled SQLite, which can differ from the one the app ships, so a passing test does not show that SQL relying on a newer SQLite feature runs in the app — check the feature against the app's engine version in `.claude/knowledge/sqlite.md`.

## Wiring a test that reaches `getDatabase()`

A test that calls a function reaching `getDatabase()` — the unit, or a module the test uses to set up state — has all four of these:

```ts
// @vitest-environment node
import { describe, it, beforeEach, vi } from 'vitest';

vi.mock('@tauri-apps/plugin-sql', async () => {
  const { openTestDatabase } =
    await import('@db/__tests__/support/sqlite-test-database');
  return { default: { load: () => Promise.resolve(openTestDatabase()) } };
});

describe('create', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('…', async () => {
    const { create } = await import('../create');
    const { getDatabase } = await import('@db/database');
    // call the unit, then assert the rows it left and the values it returned
  });
});
```

- `// @vitest-environment node` is the first line, because `node:sqlite` exists only in Node.
- The `vi.mock` is at the file's top level: Vitest rejects one anywhere else, so no helper can install it and the block repeats in every file that needs it.
- `vi.resetModules()` runs in `beforeEach`, as `app/CLAUDE.md` — Testing requires: each test gets a fresh `db/database.ts` and, with it, a fresh, freshly migrated database.
- The dynamic import covers more than the unit here: every `@db/...` module the test calls at runtime is imported with `await import(...)` inside the test — a module that creates parent rows or sets state such as `@db/pinned-order`, and `@db/database` when the test reads the database itself — and only `import type` stays static. A static import binds another `database.ts` instance and so another database: a parent-row creator imported that way fails on its foreign key, but a state-setting module imported that way updates no row and lets the assertions pass vacuously.

A suite whose subject is `initDatabase`'s or `getDatabase`'s own loading or caching differs in one place: it mocks `plugin-sql` with a `load` spy of its own that returns `openTestDatabase()` (`db/__tests__/init-database.test.ts`).

## Tests that open the database themselves

A test of a function that takes a `db` argument — a migration's `up(db)`, `runMigrations(db)`, `ensureColumn(db, …)` — calls `openTestDatabase()` directly and needs neither the mock nor the reset, only the `// @vitest-environment node` first line. A migration test that needs rows in the schema as it stood before the migration seeds them after `applyMigrationsBefore(db, migration.id)`, runs the migration, and asserts the rows it leaves.

## Timestamps

A test that orders rows by a timestamp, or asserts that a timestamp is new, fixes the clock: `vi.useFakeTimers({ toFake: ['Date'] })` and `vi.setSystemTime(...)` with a distinct instant before each write, and `vi.useRealTimers()` in `afterEach`. Rows written in the same millisecond share a timestamp, so without it the test cannot tell a correct `ORDER BY` from a wrong one, and an update can look as if it left `updated_at` unchanged. A timestamp SQLite writes itself, such as a sync trigger's `deleted_at`, is beyond fake timers: a test that compares one sets it to a literal in the fixture.
