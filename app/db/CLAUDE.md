# Database

## Structure

`db/` holds `_migrations/` (migration runner and migration files); `_system/` (infrastructure key-value store: `schema.ts` for each key's value-shape schemas and derived types, one typed accessor per key such as `versioning.ts` and `device.ts` as the public API, and `get.ts` / `update.ts` as raw SQL utilities that stay internal and are not exported from the barrel); `database.ts` (init and the migration runner call); `util/` (the `defineTable` schema builder); and one `domainName/` directory per table (schema, types, CRUD, index).

**Schema source of truth:** Each domain's `schema.ts` defines the table via `defineTable()` — read it directly rather than maintaining a separate schema list.

## Conventions

Follows the conventions in `app/CLAUDE.md` — File Organization and Directory Structure (all TypeScript layers), plus:

- **All `index.ts` barrel files in `db/` — domain barrels (`db/adventure/index.ts`) and utility barrels (`db/util/index.ts`) alike — use explicit named exports; `export *` is banned.**
  - ✅ GOOD: `export { create } from './create'` — explicit, no leakage
- Every table has `id` as PK (created with nanoid), `created_at` and `updated_at`. **Infrastructure tables prefixed with `_`** (e.g., `_migrations`, `_system`) **are exempt from `created_at`/`updated_at`, but not from the `id TEXT PRIMARY KEY` rule.**
- **Naming consistency**: All entities use `name` as the primary identifier column — never `title`, `label`, or another variation.
- **User-editable text columns are nullable**: Any column whose value is written via a text input that the user can clear entirely must be nullable in the SQL schema and `.nullable()` in the column's `zod` (no `.min(1)`, no `.refine` for empty / whitespace) — never `.optional()` there, per the `zodSchema` rule below, which also says why `updateSchema` is already optional. Debounced auto-saves send every intermediate state, including empty strings, to the DB — a NOT NULL constraint or non-empty validation there throws during normal editing. Columns set programmatically (`id`, `adventure_id`, `default_step_key`, etc.) are unaffected.
- **No unrequested schema columns**: Never add a column that was not explicitly discussed — including display-only columns (e.g. `display_name`), since how data is presented is a frontend concern. If you believe an additional column is necessary, explain why and ask for approval before adding it.
- **JSON string columns must have validated schemas**: When a column stores a JSON-serialised object or array, always:
  1. Define a named schema type (e.g. `TableLayout`) using the project's validation approach
  2. Derive TypeScript types from that schema
  3. Validate the JSON string against that schema in `create` and `update` functions before writing to the DB — TypeScript types alone don't validate data that will be serialised to a string
- **Column relocation means removal**: If instructed to move a field into another structure (e.g. "make `searchable_columns` part of `layout`"), always remove the original column unless explicitly told to keep it.
- **No `zodSchema` field carries `.optional()`, regardless of nullability.** `defineTable()` (`db/util/schema/define-table.ts`) returns `zodSchema` — one field per column, from which `z.infer<typeof table.zodSchema>` derives the domain type and against which any row may be validated at runtime, so a field must accept every value the app stores in its column, `null` included for a nullable column — and `updateSchema`, which wraps every non-PK, non-timestamp field in `.optional()` itself. A `SELECT *` row always has every column key present, so a nullable column reads as JS `null`, never `undefined`: `.optional()` on `zodSchema` falsely allows `undefined` in the derived domain type and, without `.nullable()`, rejects the `null` the column holds. Use `.nullable()` alone for nullable columns and no modifier for `NOT NULL` columns (including `NOT NULL DEFAULT x`: the field describes the stored value, which the default always fills).
  - ❌ BAD: `bio: z.string().nullable().optional()` on `zodSchema` — a nullable column's read value is `null`, never `undefined`
  - ✅ GOOD: `bio: z.string().nullable()` on `zodSchema`
  - **Grandfathered:** schema files already using `.optional()` on a `zodSchema` field as of this rule's landing — see Grandfathering below.

### Grandfathering

A rule that lands after code already violates it does not retroactively apply to that pre-existing code — the violating instance is grandfathered as of the rule's landing date. Converting a grandfathered instance is never mechanical: it changes a derived type or a tested behavior and ripples into every consumer, so the shared rules file's Best Practices & Code Quality rule beginning "When editing a file for an unrelated task, fix convention violations..." does not apply to it — never convert a grandfathered instance as a side effect of touching its file for an unrelated reason. Every grandfathering clause below applies unconditionally to new instances and to any grandfathered instance intentionally rewritten as part of a deliberate, reviewed change.

### Default Placement Hierarchy

Place defaults as close to the database as possible. Use this hierarchy:

1. **SQL schema** (`DEFAULT` clause in `schema.ts`) — for short static strings (e.g. `'active'`) and numeric literals. These are single-value constants the DB can own entirely.
2. **`create.ts`** — for any default that cannot be expressed as a SQL literal: computed strings (e.g. `'New Adventure ' + readableDatetimeString()`), and timestamps (e.g. `new Date().toISOString()` for `created_at` / `updated_at` — SQLite's `CURRENT_TIMESTAMP` produces `YYYY-MM-DD HH:MM:SS`, which is not ISO 8601 UTC).

**Exception:** Stringified JSON interpreted by a downstream consumer (e.g. a rich-text editor) belongs in `create.ts` even as a static string — the schema doesn't own content structured by an external component.
Never place defaults in the service layer or frontend — a default that travels up the call stack has left the layer that owns the schema contract (e.g. `adventureService.create()` supplying `'New Adventure ' + readableDatetimeString()` for `adventure.create()`, instead of `adventure/create.ts` computing it when `input.name` is absent).

### INSERT Best Practice

Only specify required fields in INSERT statements and let the database handle NULL for omitted optional columns. `buildCreateQuery` (`db/util/build-create-query.ts`) emits one INSERT column for every key present in the `data` object, so an optional column is omitted by leaving its key out of the `create.ts` object literal — never pass an explicit `null` for it (e.g. `image_id: validated.image_id ?? null`).

## Naming

- Use short, generic CRUD names: `create`, `get`, `getAll`, `update`, `remove` (since `delete` is a reserved keyword)
- Import as namespace in consuming files: `import * as tableName from '@db/tableName'`
- `@db/domainName` is the expected import depth for **all consumers** — including type imports from the frontend. Never reach into `@db/domainName/types` or deeper.
- File names match function names: `create.ts`, `get.ts`, `get-all.ts`, `update.ts`, `remove.ts`. This list applies only to files that implement a single CRUD operation. Non-CRUD files — schema definitions, derived types, shared utilities — are named by their concern (e.g., `schema.ts`, `types.ts`). The `1 concern → 1 file` rule in `app/CLAUDE.md` — File Organization governs these.

## Duplication

Domains that support duplication (see `db/<domain>/duplicate.ts`) share one column-copying mechanism: `buildDuplicateQuery` (`db/util/build-duplicate-query.ts`). Never compose `buildCreateQuery` + `generateDbTimestamps` directly for a duplicate operation — that bypasses the shared contract and has already produced divergent implementations once.

`duplicate.ts` always follows this shape: `assertValidId` the source id, fetch the source row, generate a new id, then destructure the source row to build `copiedColumns` — excluding `id`, `created_at`, and `updated_at` unconditionally (`buildDuplicateQuery` supplies the id and fresh timestamps) plus any column that must differ (e.g. `image_id`, when the image is duplicated separately). Excluded columns are re-supplied via the `overrides` argument; an excluded column with no override is omitted from the INSERT and takes its SQL default. Reference: `db/base-entity/duplicate.ts`.

## Cross-table utilities

Functions that operate across multiple tables (e.g., `mention-search.ts`) live as flat files at the db root, not in a domain subdirectory — a deliberate exception to the "group by table" convention, since cross-table concerns have no single domain owner.

## Migrations

Every schema change (ADD COLUMN, DROP COLUMN, change column constraint, new table, dropped table) requires a new migration file in `db/_migrations/`. Never alter `createTableSQL` in a `schema.ts` without a corresponding migration file. Initial data rows for a new domain table belong in the migration that creates it, not in a separate `seed.ts`; do not replicate the legacy `seedTableConfig` pattern.

Migration file naming: `{ms_timestamp}_{description}.ts` — the timestamp is `Date.now()` at file-creation time, assigned once, never changed, and unique.

Each migration file exports a named const of type `Migration` (`db/_migrations/index.ts`) whose `id` matches the file-name timestamp; add it to the `migrations` array in `db/_migrations/index.ts` in ascending timestamp order — `migrationHead` is read from the array's last entry.

All migrations must be idempotent — safe to re-run after the ledger already recorded them, and safe to resume after a partial failure mid-`up()`. No cross-statement atomicity is achievable through `tauri-plugin-sql`'s `execute()`/`select()` API: each call checks out an arbitrary connection from an unpinned pool, so a raw-SQL `BEGIN`/`COMMIT` wrapping multiple `execute()` calls guarantees nothing — a statement that already committed stays committed if a later one fails. The `_migrations` ledger (infrastructure owned by `database.ts` — never reference or modify it in domain code or migrations) only guarantees a completed migration never re-runs; it guarantees nothing about a migration that fails partway through, so every statement in `up()` must be independently safe to re-issue:

- Creation statements: `CREATE TABLE/TRIGGER/INDEX IF NOT EXISTS` (see `1786186021664_add_encounters.ts`).
- Row inserts: `INSERT ... SELECT ... WHERE NOT EXISTS`, keyed on a real unique column, never a freshly generated `id`. Prefer `ON CONFLICT DO NOTHING` once a unique constraint already exists on the table; use `WHERE NOT EXISTS` when the insert must be idempotent before that constraint exists (see `1780099200000_seed_table_config.ts`, which predates the unique index `1787825905519_add_table_config_unique_index.ts` adds later).
- Column additions: `ensureColumn` (`db/util/ensure-column.ts`) — a `PRAGMA table_info` check before `ALTER TABLE ... ADD COLUMN`, since `ADD COLUMN` has no `IF NOT EXISTS` form.
- Temp-table-based column changes: `DROP TABLE IF EXISTS` on the temp table before creating it.

**Migration-file duplication is required, not a DRY violation.** A migration must never depend on a live, mutable source — a shared registry, helper function, or any other value that can change after this migration has already run — for a literal or logic it needs, since a later edit would retroactively change an already-applied migration's behavior. When a migration needs such a literal or logic, freeze a local copy inside the migration file instead, with an inline comment stating what was frozen, where the live equivalent lives, and why. Exempt from the shared rules file's Best Practices & Code Quality rule beginning "Before considering any change set complete, grep for other occurrences of any raw literal..." — the frozen copy is pinned to the moment the migration ran, so it and its live counterpart are not the same call site under that rule's test. Precedent: `1786186021664_add_encounters.ts` freezes both `buildTriggerSQL`'s output and its own copy of `db/encounter/schema.ts`'s `createTableSQL`; `1784365870026_add_sync_infrastructure.ts` freezes its own copy of `SYNCED_TABLE_NAMES`.

## Testing

Every public function in a domain directory (`create`, `get`, `getAll`, `update`, `remove`) must have a corresponding test file in that directory's `__tests__/` subdirectory. See `db/adventure/__tests__/` and `db/session/__tests__/` for reference.

A migration whose `up()` destroys or irreversibly overwrites existing data — `DROP TABLE`, `DELETE FROM`, an `UPDATE` deriving a new value from other columns with no way to recover the old one, or any statement removing or replacing rows/columns with no way to reconstruct them by re-running it — or branches on existing data state (e.g. an existence check gating which statements run) needs a test file in `db/_migrations/__tests__/`, named after the migration. See `db/_migrations/__tests__/1789304154994_add_base_entities.test.ts`. A migration using only the safe-to-reissue statement shapes the Migrations section above already enumerates is exempt — no destructive, overwriting, or conditional path exists to test.

**Grandfathered:** migration files existing as of this rule's landing — see Conventions — Grandfathering above.

Test-authoring rules for `db/` — running against the in-memory database (the harness, the wiring a test that reaches `getDatabase()` needs, how a migration test seeds the schema it starts from) — are in `.claude/rules/db-unit-tests.md`, which loads when a `__tests__/` path under `db/` is read; before writing the first test in a test file you have not opened, read it directly — nothing has loaded it yet.
