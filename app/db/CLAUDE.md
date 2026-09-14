# Database

## Structure

```text
db/
├── \_migrations/ # Migration runner and migration files
├── \_system/ # Infrastructure key-value store
│ ├── schema.ts # Zod schemas and derived types for each key's value shape
│ ├── {key}.ts # Typed accessor for a key (public API) — one file per key, e.g. versioning.ts, device.ts
│ ├── get.ts # Raw SQL utility — internal, not exported from barrel
│ └── update.ts # same
├── database.ts # Init, migration runner call
├── util/ # Schema builder (defineTable)
└── domainName/ # schema, types, CRUD, index — one directory per table
```

**Schema source of truth:** Each domain's `schema.ts` defines the table via `defineTable()` — read it directly rather than maintaining a separate schema list.

## Conventions

Follows the global file organization conventions from the root CLAUDE.md, plus:

- **All `index.ts` barrel files in `db/` — domain barrels (`db/adventure/index.ts`) and utility barrels (`db/util/index.ts`) alike — use explicit named exports; `export *` is banned.**
  - ✅ GOOD: `export { create } from './create'` — explicit, no leakage
  - ❌ BAD: `export * from './build-create-query'` — leaks every symbol the source file happens to export
- All tables have at least the following columns:
  - `id` as PK (created with nanoid)
  - `created_at`
  - `updated_at`
- **Infrastructure tables prefixed with `_`** (e.g., `_migrations`, `_system`) **are exempt from the `created_at`/`updated_at` domain column requirements, but not from the `id TEXT PRIMARY KEY` naming rule** — every table, including infrastructure tables, uses `id` as its primary key column name.
- **Naming consistency**: All entities use `name` as the primary identifier column
  - Use `name`, not `title`, `label`, or other variations
  - Example: `adventures.name`, `base_entities.name`, `sessions.name`
- **User-editable text columns are nullable**: Any column whose value is written via a text input that the user can clear entirely must be defined as nullable in the SQL schema and optional in the Zod schema (no `.min(1)`, no `.refine` for empty / whitespace). Debounced auto-saves send every intermediate state, including empty strings, to the DB — a NOT NULL constraint or non-empty validation there throws during normal editing.
  - Columns set programmatically (`id`, `adventure_id`, `default_step_key`, etc.) are unaffected by this rule.
  - ❌ BAD: `sessions.name` defined as `NOT NULL` with `z.string().min(1).refine(val => val.trim().length > 0)` — throws when the user clears the input field mid-edit
  - ✅ GOOD: `sessions.name TEXT` (nullable SQL) + `z.string().optional()` in the Zod schema
- **No unrequested schema columns**: Never add a column that was not explicitly discussed. If you believe an additional column is necessary, explain why and ask for approval before adding it.
- **Frontend display is a frontend concern**: Do not add columns for display purposes (e.g. `display_name`) unless explicitly asked. How data is presented is handled in the frontend.
- **JSON string columns must have validated schemas**: When a column stores a JSON-serialised object or array, always:
  1. Define a named schema type (e.g. `TableLayout`) using the project's validation approach
  2. Derive TypeScript types from that schema
  3. Validate the JSON string against that schema in `create` and `update` functions before writing to the DB — TypeScript types alone don't validate data that will be serialised to a string
- **Column relocation means removal**: If instructed to move a field into another structure (e.g. "make `searchable_columns` part of `layout`"), always remove the original column unless explicitly told to keep it.
- **Trust the validated output**: After a successful `schema.parse(data)` call, all non-optional fields are guaranteed to be defined. Never add conditional spreads, nullish coalescing, or optional chaining on required fields after the parse — defensive handling belongs before it.
  - ❌ BAD: `...(validated.scope !== undefined && { scope: validated.scope })` — `scope` is required in the schema
  - ✅ GOOD: `scope: validated.scope` — the parse already guarantees it
- **No `zodSchema` field carries `.optional()`, regardless of nullability.** `defineTable()` (`db/util/schema/define-table.ts`) returns `zodSchema` (one field per column, used only as a type-inference source via `z.infer<typeof table.zodSchema>` — never runtime-parsed against a read row) and `updateSchema` (every non-PK, non-timestamp field wrapped `.optional()` via `.partial()`). A `SELECT *` row always has every column key present — a nullable column reads as JS `null`, never `undefined` — so `.optional()` on `zodSchema` falsely allows `undefined` in the derived domain type. Use `.nullable()` alone for nullable columns, no modifier for `NOT NULL` columns (including `NOT NULL DEFAULT x`, since `create.ts` builds its own object literal per domain and never reads `zodSchema`).
  - ❌ BAD: `active_view: z.enum(['prep', 'run']).optional()` on `zodSchema` — allows `undefined` in the derived `Session` type, misrepresenting `NOT NULL`
  - ❌ BAD: `bio: z.string().nullable().optional()` on `zodSchema` — a nullable column's read value is `null`, never `undefined`
  - ✅ GOOD: `active_view: z.enum(['prep', 'run'])` on `zodSchema`
  - ✅ GOOD: `bio: z.string().nullable()` on `zodSchema`
  - **Grandfathered:** the 10 schema files already using `.optional()` on a `zodSchema` field as of this rule's landing — see Grandfathering below.

### Grandfathering

A rule that lands after code already violates it does not retroactively apply to that pre-existing code — the violating instance is grandfathered as of the rule's landing date. Converting a grandfathered instance is never mechanical: it changes a derived type or a tested behavior and ripples into every consumer, so the shared rules file's Best Practices & Code Quality rule beginning "When editing a file for an unrelated task, fix convention violations..." does not apply to it — never convert a grandfathered instance as a side effect of touching its file for an unrelated reason. Every grandfathering clause below applies unconditionally to new instances and to any grandfathered instance intentionally rewritten as part of a deliberate, reviewed change.

### Default Placement Hierarchy

Place defaults as close to the database as possible. Use this hierarchy:

1. **SQL schema** (`DEFAULT` clause in `schema.ts`) — for short static strings (e.g. `'active'`) and numeric literals. These are single-value constants the DB can own entirely.
2. **`create.ts`** — for any default that cannot be expressed as a SQL literal: computed strings (e.g. `'New Adventure ' + readableDatetimeString()`), and timestamps (e.g. `new Date().toISOString()` for `created_at` / `updated_at` — SQLite's `CURRENT_TIMESTAMP` produces `YYYY-MM-DD HH:MM:SS`, which is not ISO 8601 UTC).

**Exception:** Stringified JSON interpreted by a downstream consumer (e.g. a rich-text editor) belongs in `create.ts` even as a static string — the schema doesn't own content structured by an external component. This holds even when the value is also a `Record<DomainType, string>` lookup table keyed by a `domain/` type: a genuine DB column default is placed by this hierarchy regardless of that keying. `app/domain/CLAUDE.md` — What Belongs Here's constant-lookup-table rule governs a lookup table's placement only when its value is not itself a DB default (e.g. a route-segment or display-label lookup).

Never place defaults in the service layer or frontend. A default that travels up the call stack has left the layer that owns the schema contract.

- ❌ BAD: `adventureService.create()` supplies `name: 'New Adventure ' + readableDatetimeString()` and passes it to `adventure.create()`
- ✅ GOOD: `adventure/create.ts` computes `name: 'New Adventure ' + readableDatetimeString()` when `input.name` is absent
- ❌ BAD: Schema column `status TEXT NOT NULL` with no `DEFAULT` — service passes `'active'` on every call
- ✅ GOOD: Schema column `status TEXT NOT NULL DEFAULT 'active'` — no caller involvement needed

### INSERT Best Practice

Only specify required fields in INSERT statements. Let the database handle NULL for omitted optional columns:

```typescript
// ✅ GOOD - only required fields
await db.execute(
  'INSERT INTO base_entities (id, adventure_id, entity_type, name) VALUES ($1, $2, $3, $4)',
  [id, validated.adventure_id, validated.entity_type, validated.name],
);

// ❌ BAD - explicit NULL for an omitted optional field
await db.execute(
  'INSERT INTO base_entities (id, adventure_id, entity_type, name, image_id) VALUES ($1, $2, $3, $4, $5)',
  [
    id,
    validated.adventure_id,
    validated.entity_type,
    validated.name,
    validated.image_id ?? null,
  ],
);
```

## Naming

- Use short, generic CRUD names: `create`, `get`, `getAll`, `update`, `remove` (since `delete` is a reserved keyword)
- Import as namespace in consuming files: `import * as tableName from '@db/tableName'`
- `@db/domainName` is the expected import depth for **all consumers** — including type imports from the frontend. Never reach into `@db/domainName/types` or deeper.
- File names match function names: `create.ts`, `get.ts`, `get-all.ts`, `update.ts`, `remove.ts`. This list applies only to files that implement a single CRUD operation. Non-CRUD files — schema definitions, derived types, shared utilities — are named by their concern (e.g., `schema.ts`, `types.ts`). The root CLAUDE.md `1 concern → 1 file` rule governs these.

## Duplication

Domains that support duplication (see `db/<domain>/duplicate.ts`) share one column-copying mechanism: `buildDuplicateQuery` (`db/util/build-duplicate-query.ts`). Never compose `buildCreateQuery` + `generateDbTimestamps` directly for a duplicate operation — that bypasses the shared contract and has already produced divergent implementations once.

`duplicate.ts` always follows this shape: `assertValidId` the source id, fetch the source row, generate a new id, then destructure the source row to build `copiedColumns` — excluding `id`, `created_at`, and `updated_at` unconditionally (`buildDuplicateQuery` supplies the id and generates fresh timestamps itself), plus any column that must differ (e.g. `image_id`, when the image is duplicated separately). Columns excluded from `copiedColumns` are re-supplied via the `overrides` argument — an excluded column with no override is omitted from the INSERT and takes its SQL default. Reference: `db/base-entity/duplicate.ts` + `db/util/build-duplicate-query.ts`.

- ✅ GOOD: `const { id: _id, name: _name, image_id: _imageId, pinned_order: _pinnedOrder, created_at: _createdAt, updated_at: _updatedAt, ...copiedColumns } = source; buildDuplicateQuery('base_entities', newId, copiedColumns, { image_id: newImageId })`
- ❌ BAD: hand-rolling `buildCreateQuery(tableName, newId, { ...source, id: newId, ...generateDbTimestamps() })` — reimplements the exclude-then-spread contract per domain instead of delegating to `buildDuplicateQuery`

## Cross-table utilities

Functions that operate across multiple tables (e.g., `mention-search.ts`) live as flat files at the db root, not in a domain subdirectory — a deliberate exception to the "group by table" convention, since cross-table concerns have no single domain owner.

## Seeds

With the migration system in place, initial data rows for new domain tables belong in the migration
that creates the table — not in a separate `seed.ts` file. The legacy `seedTableConfig` pattern must not be replicated for new tables.

## Migrations

Every schema change (ADD COLUMN, DROP COLUMN, change column constraint, new table, dropped table) requires a new migration file in `db/_migrations/`. Never alter `createTableSQL` in a `schema.ts` without a corresponding migration file.

Migration file naming: `{ms_timestamp}_{description}.ts` — the timestamp is `Date.now()` at file-creation time, assigned once, never changed, and unique.

Each migration file exports a named const `{ id: string, up: (db: Database) => Promise<void> }`, where `id` matches the file-name timestamp; add the file to the `migrations` array in `db/_migrations/index.ts` in ascending timestamp order.

All migrations must be idempotent — safe to re-run after the ledger already recorded them, and safe to resume after a partial failure mid-`up()`. No cross-statement atomicity is achievable through `tauri-plugin-sql`'s `execute()`/`select()` API: each call checks out an arbitrary connection from an unpinned pool, so a raw-SQL `BEGIN`/`COMMIT` wrapping multiple `execute()` calls guarantees nothing — a statement that already committed stays committed if a later one fails. The `_migrations` ledger only guarantees a completed migration never re-runs; it guarantees nothing about a migration that fails partway through, so every statement in `up()` must be independently safe to re-issue:

- Creation statements: `CREATE TABLE/TRIGGER/INDEX IF NOT EXISTS` (see `1786186021664_add_encounters.ts`).
- Row inserts: `INSERT ... SELECT ... WHERE NOT EXISTS`, keyed on a real unique column, never a freshly generated `id`. Prefer `ON CONFLICT DO NOTHING` once a unique constraint already exists on the table; use `WHERE NOT EXISTS` when the insert must be idempotent before that constraint exists (see `1780099200000_seed_table_config.ts`, which predates the unique index `1787825905519_add_table_config_unique_index.ts` adds later).
- Column additions: `ensureColumn` (`db/util/ensure-column.ts`) — a `PRAGMA table_info` check before `ALTER TABLE ... ADD COLUMN`, since `ADD COLUMN` has no `IF NOT EXISTS` form.
- Temp-table-based column changes: `DROP TABLE IF EXISTS` on the temp table before creating it.

The `_migrations` table is infrastructure owned by `database.ts`. Never reference or modify it in domain code or migrations.

**Migration-file duplication is required, not a DRY violation.** A migration must never depend on a live, mutable source — a shared registry, helper function, or any other value that can change after this migration has already run — for a literal or logic it needs, since a later edit would retroactively change an already-applied migration's behavior. When a migration needs such a literal or logic, freeze a local copy inside the migration file instead, with an inline comment stating what was frozen, where the live equivalent lives, and why. Exempt from root CLAUDE.md's duplicate-raw-literal DRY rule — the frozen copy is pinned to the moment the migration ran, so it and its live counterpart are not the same call site under that rule's test. Precedent: `1786186021664_add_encounters.ts` freezes both `buildTriggerSQL`'s output and its own copy of `db/encounter/schema.ts`'s `createTableSQL`; `1784365870026_add_sync_infrastructure.ts` freezes its own copy of `SYNCED_TABLE_NAMES`.

## Testing

Every public function in a domain directory (`create`, `get`, `getAll`, `update`, `remove`) must have a corresponding test file in that directory's `__tests__/` subdirectory. See `db/adventure/__tests__/` and `db/session/__tests__/` for reference.

A migration whose `up()` destroys or irreversibly overwrites existing data — `DROP TABLE`, `DELETE FROM`, an `UPDATE` deriving a new value from other columns with no way to recover the old one, or any statement removing or replacing rows/columns with no way to reconstruct them by re-running it — or branches on existing data state (e.g. an existence check gating which statements run) needs a test file in `db/_migrations/__tests__/`, named after the migration. See `db/_migrations/__tests__/1789304154994_add_base_entities.test.ts`. A migration using only the safe-to-reissue statement shapes the Migrations section above already enumerates is exempt — no destructive, overwriting, or conditional path exists to test.

**Grandfathered:** migration files existing as of this rule's landing, including `1787825905519_add_table_config_unique_index.ts`'s untested `DELETE` — see Conventions — Grandfathering above.

Every test file that calls `vi.mock('@tauri-apps/plugin-sql', ...)` at module scope must reset the module registry between tests. Default: `afterEach(() => { vi.resetModules(); })` with a static top-level import of the function under test — correct for domain CRUD test files (see `db/adventure/__tests__/`, `db/session/__tests__/`), where `getDatabase()` is incidental plumbing and every assertion targets `mockExecute`/`mockSelect` call history, already reset per test by `vi.clearAllMocks()` regardless of the module-level `db` cache. The stricter pattern — `vi.resetModules()` in `beforeEach` plus a dynamic `await import('../moduleName')` inside each test body, never a static top-level import — is required only when the suite itself asserts on `initDatabase`'s or `getDatabase`'s own init-or-caching behavior (e.g. `db/__tests__/init-database.test.ts`, expecting the full migration-running path to re-fire on every call): there, a stale cached `db` from a prior test would silently short-circuit that path and falsify the assertion.

Every test that calls `getDatabase()` runs the full init path, which runs migrations and calls `database.select()` to check applied ones — omitting `mockSelect.mockResolvedValue([])` crashes the init. Any test file that invokes `getDatabase()` — directly or indirectly — must call `mockSelect.mockResolvedValue([])` in its `beforeEach` block before any other setup.
