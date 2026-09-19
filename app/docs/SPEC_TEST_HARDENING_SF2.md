# SF2 — Real-SQLite test harness

Database tests get an in-memory SQLite database that behaves like the app's sqlx connection and is built by the app's own migrations. This SF adds the harness module and its own test, and makes coverage report `db/` and `util/`. No existing test changes here; SF3–SF7 move the db tests onto the harness.

## Files affected

- New: `app/db/__tests__/support/sqlite-test-database.ts` — the harness.
- New: `app/db/__tests__/support/__tests__/sqlite-test-database.test.ts` — the harness's own tests.
- Modified: `app/vitest.config.ts` — `coverage.include` gains `'db/**/*.ts'` and `'util/**/*.ts'`; `coverage.exclude` becomes `['**/__tests__/**']`.

`app/db/__tests__/support/` is a new directory; no sibling file or directory name collides with it (`app/db/__tests__/` holds only `init-database.test.ts`, `mention-search.test.ts` and `pinned-order.test.ts`). The harness is not a module directory and has no barrel: its importers name the file directly.

## Database

### `app/db/__tests__/support/sqlite-test-database.ts`

Placement, names and consumers are fixed by the root KAD "One harness module, imported only by db tests": only test files under `app/db/**/__tests__/` import this file, always through the alias path `@db/__tests__/support/sqlite-test-database` (resolved by `app/tsconfig.json`'s `@db/*` path and `app/vitest.config.ts`'s `@db` alias), so the specifier is the same at every directory depth. The file name follows `app/db/`'s kebab-case file naming (`build-create-query.ts`, `get-all.ts`).

Top-of-file comment (one paragraph): what the module stands in for (`@tauri-apps/plugin-sql`'s `Database`, loaded by `db/database.ts`); that importers must run under `// @vitest-environment node`; the exact wiring a db test uses — a top-level `vi.mock('@tauri-apps/plugin-sql', async () => { const { openTestDatabase } = await import('@db/__tests__/support/sqlite-test-database'); return { default: { load: () => Promise.resolve(openTestDatabase()) } }; })`, `vi.resetModules()` in `beforeEach`, and `await import(...)` inside each test of every `@db/...` module the test calls at runtime — the unit, any module that creates parent rows or sets state such as `@db/pinned-order`, and `@db/database` when the test reads the database directly — with only `import type` static, because a static import binds another `database.ts` instance and so another database; and that such a file needs no `mockSelect` scoping, because every query runs against a real database.

Imports: `DatabaseSync` and the type `SQLInputValue` from `node:sqlite` (declared in `app/node_modules/@types/node/sqlite.d.ts`, which `app/tsconfig.json`'s `types: ["node"]` includes); `migrations` from `@db/_migrations`; the type `QueryResult` from `@tauri-apps/plugin-sql`.

Exports, exactly these three:

```ts
export type TestDatabase = {
  path: string;
  execute: (query: string, bindValues?: unknown[]) => Promise<QueryResult>;
  select: <T>(query: string, bindValues?: unknown[]) => Promise<T>;
  close: () => Promise<boolean>;
  callCount: () => number;
  failOnCall: (callNumber: number) => void;
};

export const openTestDatabase = (): TestDatabase => { … };

export const applyMigrationsBefore = async (
  db: TestDatabase,
  migrationId: string,
): Promise<void> => { … };
```

With `path` present, a `TestDatabase` is assignable to plugin-sql's `Database` as it is, so tests and `applyMigrationsBefore` pass it to `up(db)`, `runMigrations(db)` and `ensureColumn(db, …)` with no cast [spec-writer_35: ran `npx tsc --noEmit` on a scratch copy of the harness and SF3's migration tests with `path` removed from the type and the object, then restored — observed TS2345 "Argument of type 'TestDatabase' is not assignable to parameter of type 'Database'" at every uncast call site without it, and no error with it]. Consumers of the `TestDatabase` type: SF3's migration-test snapshot helper takes one as its parameter.

`openTestDatabase` behavior:

- Opens `new DatabaseSync(':memory:')`, runs `PRAGMA foreign_keys = ON`, and sets `path` to `':memory:'`.
- Every `execute` and `select` call first increments a call counter that starts at 0; `callCount()` returns it. SF3's resume tests read it to count the calls a clean migration makes.
- `failOnCall(n)` arms a one-shot failure: the call whose counter value becomes `n` rejects with `new Error('Injected failure')` before touching the database, and later calls run normally. SF3's resume tests use it.
- Every failure is a rejected promise, never a synchronous throw, as with plugin-sql: each of `execute`, `select` and `close` wraps its synchronous body as `new Promise((resolve) => { resolve(body()); })`, so an SQLite error, the statement guard and an injected failure all reject. Writing the methods as `async` functions with no `await` would fail `@typescript-eslint/require-await` (root KAD "Test-file wiring under Vitest 5").
- `execute(query, bindValues)` with no bind values (argument absent or an empty array) runs `db.exec(query)` and returns `{ rowsAffected, lastInsertId }` read with `SELECT changes() AS rowsAffected, last_insert_rowid() AS lastInsertId`.
- Every other query — `execute` with bind values, and every `select` — is prepared: trim trailing whitespace and one trailing `;`; when the remaining text still contains `;`, reject with an `Error` whose message starts with `Multi-statement SQL is not supported by prepare():` followed by the query; otherwise rewrite each `$<digits>` to `?<digits>` (regex `/\$(\d+)/g` → `'?$1'`) and prepare it.
  - `execute` runs `statement.run(...(bindValues as SQLInputValue[]))` and returns `{ rowsAffected: Number(result.changes), lastInsertId: Number(result.lastInsertRowid) }`;
  - `select` runs `statement.all(...((bindValues ?? []) as SQLInputValue[]))` and resolves `rows.map((row) => ({ ...row })) as T` — each row copied into a plain object.
  - One comment covers the two bind-value casts: plugin-sql types bind values as `unknown[]`, and the values db code passes are strings, numbers and `null`, which `SQLInputValue` covers. The `as T` cast gets its own comment: plugin-sql's `select<T>` returns whatever the IPC call delivers as the caller-named `T` without checking it (app/node_modules/@tauri-apps/plugin-sql/dist-js/index.js:117-124), and the adapter does the same.
- `close()` closes the database and resolves `true`.

`applyMigrationsBefore(db, migrationId)` runs `up(db)` of every entry of `migrations` whose `id` sorts before `migrationId` (`id < migrationId`, a string comparison, which orders the ids correctly because they are same-length `Date.now()` timestamps kept in ascending array order — `app/db/CLAUDE.md` — Migrations — and SF3's id-order test enforces both), in array order, and writes no `_migrations` ledger rows. It lets a migration test seed data in the schema that existed just before the migration under test.

### `app/db/__tests__/support/__tests__/sqlite-test-database.test.ts`

First line `// @vitest-environment node`. No `vi.mock` — each test calls `openTestDatabase()` directly. Rejections are asserted with `await expect(...).rejects.toThrow(...)`.

| Test | Defect it catches |
| --- | --- |
| an `INSERT INTO t (a, b) VALUES ($2, $1)` with bind values `['for-b', 'for-a']` stores `a = 'for-a'` and `b = 'for-b'`, and `select('SELECT a FROM t WHERE b = $2 AND a = $1', ['for-a', 'for-b'])` finds that row | a positional (occurrence-order) rewrite that swaps values, in either method |
| a two-statement string with bind values rejects in `execute`, a two-statement `select` rejects, and a bind-carrying `execute` and a `select`, each ending in `;`, both run | the statement guard missing (the second statement silently dropped) or over-matching a trailing semicolon |
| a two-statement string without bind values (two `CREATE TABLE`) creates both tables | bindless SQL going through `prepare()`, dropping every statement after the first |
| inserting a child row whose parent does not exist rejects | foreign keys not enforced — for any reason, including a change to node:sqlite's default — so every cascade and foreign-key test would pass vacuously |
| rows returned by `select` have `Object.prototype` as their prototype | rows returned uncopied (null prototype) |
| after `failOnCall(2)`, the first call (a `CREATE TABLE`) succeeds, the second (an `INSERT`) rejects with `Injected failure` and its row is absent, the third succeeds, and `callCount()` is 3 | the failure fired on the wrong call, more than once, or after the statement ran; or a counter that skips `select` |
| `applyMigrationsBefore(db, '1789743068849')` leaves `base_entities` with a `summary` column, no `base_entity_content_sections` table and no `_migrations` table in `sqlite_master` | running the target migration or later ones, or creating a ledger that makes `runMigrations` skip them |

### `app/vitest.config.ts`

Test tooling configuration for the whole app; listed under this layer because the change exists to report `db/` coverage.

- `coverage.include` becomes `['src/**/*.{ts,tsx}', 'services/**/*.ts', 'domain/**/*.ts', 'db/**/*.ts', 'util/**/*.ts']`. `db/` and `util/` were never reported. Vitest 5 matches these patterns against paths relative to the project root, which is `app/` when run from there, with the exclude list applied as picomatch's `ignore` [spec-writer_36: app/node_modules/vitest/dist/chunks/index.DzobfTyw.js:9381, :14915-14953; ran vitest's own picomatch on `db/**/*.ts` with the exclude list as `ignore` — observed `db/database.ts` and `db/_migrations/index.ts` matching and `db/adventure/__tests__/get.test.ts` not matching].
- `coverage.exclude` becomes `['**/__tests__/**']`, so the harness under `__tests__/support/` is not reported as application code. Its default is empty, and Vitest appends its fixed exclusions (test files, setup files, config files, `node_modules`) to whatever is set [spec-writer_37: app/node_modules/vitest/dist/chunks/index.DzobfTyw.js:14465-14482].
