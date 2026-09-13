# Base Entities Migration Fixes

Follow-up on branch `refactor/base-entities-consolidation`. The data-moving migration `app/db/_migrations/1789304154994_add_base_entities.ts` gets its first automated test and corrected comments. No SQL string, statement order, or runtime behavior changes.

## Progress tracker

- Sub-feature 1: Migration comment corrections — remove step-number references that exist nowhere in the code, state the interpolation-safety rationale where the interpolations are, and remove a duplicated rationale
- Sub-feature 2: Migration test — cover both per-table paths (legacy table present, legacy table already dropped by an earlier partial run) and the statement ordering the migration's correctness depends on

## Key Architectural Decisions

### Comment-only edits to an already-applied migration are safe

The migration is already applied on at least one database. The `_migrations` ledger guarantees a completed migration's `up()` never re-runs [spec-writer_1: app/db/CLAUDE.md:135], and fresh installs execute exactly the same statements, so a comment edit changes no database's outcome. Sub-feature 1 must not change any string passed to `db.execute` or `db.select`, or the order of those calls — Sub-feature 2 asserts those strings exactly.

### The test drives `up()` with an injected mock database

`addBaseEntitiesMigration.up` receives its `Database` as an argument and reads no module-level singleton [spec-writer_2: app/db/_migrations/1789304154994_add_base_entities.ts:31-92 — as of c8aaf218]. The test therefore passes a `{ execute, select }` mock object cast to the parameter type, as `runMigrations.test.ts` does [spec-writer_3: `app/db/_migrations/__tests__/runMigrations.test.ts:19-22`]. Neither the module-scope `@tauri-apps/plugin-sql` mock nor `vi.resetModules()` applies: `app/CLAUDE.md` — Testing and `app/db/CLAUDE.md` — Testing require them only for code that reaches the `getDatabase()` singleton or mocks `plugin-sql` at module scope.

### Two per-table paths, one named test each

For each legacy table, the migration follows one of two paths [spec-writer_2, lines 63-91]:

- **table present:** existence check finds the table; copy rows, re-key tombstones, drop, clean up `_sync_changes`
- **table already dropped:** the check finds nothing because an earlier, partially failed run already dropped it; no copy, but tombstone re-key, drop, and cleanup still run

The second path is the resume-safety guarantee a first implementation draft got wrong before commit. Each path gets its own named test, plus a test pinning the statement order within a table and one pinning triggers-before-copy.

### First per-migration test file

No migration in `app/db/_migrations/` has its own test file [spec-writer_4: glob app/db/_migrations/**/* — only `__tests__/runMigrations.test.ts` besides migration files, as of c8aaf218]. This spec introduces the form:

- placement: `app/db/_migrations/__tests__/`, next to `runMigrations.test.ts`
- file name: the migration's file name with `.test.ts` replacing `.ts`
- the only import from production code is the migration's exported object, from `'../<migration file name without extension>'`; no production file imports the test

The test declares its own copy of the six legacy table names in expected order rather than importing anything: the migration does not export its frozen list, and the test's purpose is to pin that list's contents and order independently.

## Sub-feature 1: Migration comment corrections

Correct four comments in the migration. The shared Code Style rule "A comment should never cite a temporary artifact (a spec, a ticket, a one-off planning doc) as its rationale source" is violated by two comments that reference step numbers existing only in the spec that produced the file. One comment states an interpolation-safety rationale on a statement that interpolates nothing, while the two statements that do interpolate carry none, and it repeats the rationale of the comment directly above it [spec-writer_5: app/db/_migrations/1789304154994_add_base_entities.ts:34,64,73,84,85,87 — as of c8aaf218].

### Files affected

Modified:

- `app/db/_migrations/1789304154994_add_base_entities.ts` — comments only; the four changes below

New: none

Moved: none

Draft: none

### Database

1. Line 34: replace the phrase `the legacy tables' own change records are deleted in step 5 below` with `the legacy tables' own change records are deleted by the per-table _sync_changes cleanup at the end of the loop below`. The rest of the comment is unchanged.
2. Line 64: replace `(step 4 below)` with `(by the DROP TABLE statement below)`.
3. Insert one single-line comment directly above line 63, `for (const table of LEGACY_BASE_ENTITY_TABLES) {`: `table is interpolated into the copy INSERT and the DROP TABLE statement inside this loop because SQL does not support parameterized table names; it only ever comes from the fixed LEGACY_BASE_ENTITY_TABLES constant above, never from user input (mirrors backfill_sync_changes.ts).` One comment covers both interpolations (lines 73 and 85) because both sit inside the loop it annotates.
4. Line 87: delete the whole comment line. Its first sentence repeats line 84's comment; its second sentence is replaced by change 3.

The remaining comments (lines 3, 21, 71, 78, 84) name only code constructs and `app/db/CLAUDE.md` — Migrations, and stay unchanged.

### Modified-file scan

The file contains no JSX and no `void`-context `return null`. No other violation found.

## Sub-feature 2: Migration test

Add the first per-migration test (KAD: First per-migration test file), covering the two per-table paths and the ordering guarantees.

### Files affected

Modified: none

New:

- `app/db/_migrations/__tests__/1789304154994_add_base_entities.test.ts`

Moved: none

Draft: none

### Database

**Setup** (KAD: The test drives `up()` with an injected mock database):

- `import { describe, it, expect, beforeEach, vi } from 'vitest';` and `import { addBaseEntitiesMigration } from '../1789304154994_add_base_entities';`
- module-scope `mockExecute = vi.fn()` and `mockSelect = vi.fn()`; `mockDb = { execute: mockExecute, select: mockSelect } as unknown as Parameters<typeof addBaseEntitiesMigration.up>[0]`
- `beforeEach`: `vi.clearAllMocks()`, then `mockExecute.mockResolvedValue({})`
- test-local expected values, copied from the committed migration [spec-writer_2, lines 66, 73, 80, 85, 88]:
  - `LEGACY_TABLES = ['npcs', 'pcs', 'foes', 'factions', 'locations', 'items']`
  - `EXISTENCE_SQL = "SELECT name FROM sqlite_master WHERE type = 'table' AND name = $1"`
  - `copySql(table)` returning the template literal `` `INSERT INTO base_entities (id, adventure_id, entity_type, name, summary, description, image_id, pinned_order, created_at, updated_at) SELECT id, adventure_id, $1, name, summary, description, image_id, pinned_order, created_at, updated_at FROM ${table} WHERE true ON CONFLICT(id) DO NOTHING` ``
  - `TOMBSTONE_SQL = "INSERT INTO _sync_changes (id, table_name, row_id, seq, deleted, deleted_at) SELECT 'base_entities:' || row_id, 'base_entities', row_id, seq, deleted, deleted_at FROM _sync_changes WHERE table_name = $1 AND deleted = 1 ON CONFLICT(id) DO NOTHING"`
  - `CLEANUP_SQL = 'DELETE FROM _sync_changes WHERE table_name = $1'`
  - a call-index finder over `mockExecute.mock.calls` that matches a call's SQL string and, when given, its first bound value — needed because `TOMBSTONE_SQL` and `CLEANUP_SQL` are identical for every table and differ only in the bound table name

Execute call shapes, per the committed file: the `CREATE TABLE` statement, the three triggers, and each `DROP TABLE IF EXISTS <table>` are called with one argument; the copy, tombstone, and cleanup statements with two (SQL, `[table]`).

**Tests** — one `describe('addBaseEntitiesMigration.up')`, with:

1. `'creates base_entities and its three sync triggers before copying any row'`
   - `mockSelect` resolves `[{ name: 'present' }]` for every call
   - the first execute call's SQL contains `'CREATE TABLE IF NOT EXISTS base_entities'`
   - the second, third, and fourth contain `'CREATE TRIGGER IF NOT EXISTS trg_sync_base_entities_insert'`, `'CREATE TRIGGER IF NOT EXISTS trg_sync_base_entities_update'`, and `'CREATE TRIGGER IF NOT EXISTS trg_sync_base_entities_delete'` in that order
   - the index of every call whose SQL starts with `'INSERT INTO base_entities'` is greater than `3`
2. `'checks each legacy table for existence in sqlite_master, in order'`
   - `mockSelect` resolves `[{ name: 'present' }]`
   - `mockSelect` is called exactly 6 times
   - call N (N = 1–6) is `(EXISTENCE_SQL, [LEGACY_TABLES[N - 1]])` via `toHaveBeenNthCalledWith`
3. `'copies every legacy table that still exists and still re-keys, drops, and cleans it up'` — path: table present
   - `mockSelect` resolves `[{ name: 'present' }]`
   - for every table in `LEGACY_TABLES`, `mockExecute` was called with `(copySql(table), [table])`, `(TOMBSTONE_SQL, [table])`, `` (`DROP TABLE IF EXISTS ${table}`) ``, and `(CLEANUP_SQL, [table])`
4. `'skips the copy for an already-dropped legacy table but still re-keys its tombstones, drops it, and cleans up'` — path: table already dropped
   - `mockSelect.mockImplementation((_sql: string, values: string[]) => Promise.resolve(values[0] === 'npcs' ? [] : [{ name: values[0] }]))`
   - `mockExecute` was not called with `(copySql('npcs'), ['npcs'])`
   - `mockExecute` was called with `(TOMBSTONE_SQL, ['npcs'])`, `('DROP TABLE IF EXISTS npcs')`, and `(CLEANUP_SQL, ['npcs'])`
   - `mockExecute` was still called with `(copySql('pcs'), ['pcs'])` — a missing table affects only its own iteration
5. `'runs copy, tombstone re-key, drop, and cleanup in that order within a table'`
   - `mockSelect` resolves `[{ name: 'present' }]`
   - for `'factions'`, the call index of `(copySql('factions'), ['factions'])` is less than that of `(TOMBSTONE_SQL, ['factions'])`, which is less than that of `('DROP TABLE IF EXISTS factions')`, which is less than that of `(CLEANUP_SQL, ['factions'])`

Tests 3 and 4 are the two per-table paths named in KAD: Two per-table paths, one named test each. Test 1 pins the trigger-before-copy ordering that gives every copied row a sync change record; test 5 pins the within-table ordering that keeps a resumed run safe.

## CLAUDE.md impact

- `app/db/CLAUDE.md` — Testing requires a test file for "every public function in a domain directory (`create`, `get`, `getAll`, `update`, `remove`)" and states nothing about migration `up()` functions [spec-writer_6: app/db/CLAUDE.md:143]. The irreversible data-moving migration `1789304154994_add_base_entities.ts` therefore shipped without a test until this spec added the first per-migration test file, and the next migration that copies, re-keys, or drops existing rows carries no stated test obligation.
