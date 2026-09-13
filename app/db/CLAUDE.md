# Database

## Structure

```text
db/
├── \_migrations/ # Migration runner and migration files
├── \_system/ # Infrastructure key-value store
│ ├── schema.ts # Zod schemas and derived types for each key's value shape
│ ├── {key}.ts # Typed accessor for a key (public API) — one file per key, e.g. versioning.ts, device.ts
│ ├── get.ts # Raw SQL utility — internal, not exported from barrel
│ └── update.ts # Raw SQL utility — internal, not exported from barrel
├── database.ts # Init, migration runner call
├── util/ # Schema builder (defineTable)
└── domainName/ # schema, types, CRUD, index — one directory per table
```

**Schema source of truth:** Each domain's `schema.ts` defines the table via `defineTable()`. Don't maintain a separate schema list — read the `schema.ts` files directly.

## Conventions

Follows the global file organization conventions from the root CLAUDE.md, plus:

- **All `index.ts` barrel files in `db/` use explicit named exports — `export *` is banned.** This applies to both domain barrels (`db/adventure/index.ts`) and utility barrels (`db/util/index.ts`).
  - ✅ GOOD: `export { create } from './create'` — explicit, no leakage
  - ❌ BAD: `export * from './build-create-query'` — leaks every symbol the source file happens to export
- All functions for 1 table should be grouped in a directory
- Defensive input validation with clear error messages
- All tables have at least the following columns:
  - `id` as PK (created with nanoid)
  - `created_at`
  - `updated_at`
- **Infrastructure tables prefixed with `_` (e.g., `_migrations`, `_system`) are exempt from the `created_at` and `updated_at` domain column requirements. The `id TEXT PRIMARY KEY` naming rule is **not** exempt — all tables, including infrastructure tables, use `id` as the primary key column name. Infrastructure tables define their own schema otherwise to match their structural purpose.**
- **Naming consistency**: All entities use `name` as the primary identifier column
  - Use `name`, not `title`, `label`, or other variations
  - Example: `adventures.name`, `base_entities.name`, `sessions.name`
  - This creates consistency across the database schema
- **User-editable text columns are nullable**: Any column whose value is written via a text input that the user can clear entirely must be defined as nullable in the SQL schema and optional in the Zod schema (no `.min(1)`, no `.refine` for empty / whitespace). Debounced auto-saves send every intermediate state — including empty strings — to the DB; NOT NULL constraints and non-empty validation on these columns cause runtime errors during normal editing.
  - Columns set programmatically (`id`, `adventure_id`, `default_step_key`, etc.) are unaffected by this rule.
  - ❌ BAD: `sessions.name` defined as `NOT NULL` with `z.string().min(1).refine(val => val.trim().length > 0)` — throws when the user clears the input field mid-edit
  - ✅ GOOD: `sessions.name TEXT` (nullable SQL) + `z.string().optional()` in the Zod schema
- **No unrequested schema columns**: Never add a column that was not explicitly discussed. If you believe an additional column is necessary, explain why and ask for approval before adding it.
- **Frontend display is a frontend concern**: Do not add columns for display purposes (e.g. `display_name`) unless explicitly asked. How data is presented is handled in the frontend.
- **JSON string columns must have validated schemas**: When a column stores a JSON-serialised object or array, always:
  1. Define a named schema type (e.g. `TableLayout`) using the project's validation approach
  2. Derive TypeScript types from that schema
  3. Validate the JSON string against that schema in `create` and `update` functions before writing to the DB
  - Never rely on TypeScript types alone to validate data that will be serialised to a string
- **Column relocation means removal**: If instructed to move a field into another structure (e.g. "make `searchable_columns` part of `layout`"), always remove the original column unless explicitly told to keep it.
- **Trust the validated output**: After a successful `schema.parse(data)` call, all non-optional fields are guaranteed to be defined. Never add conditional spreads, nullish coalescing, or optional chaining on fields the schema marks as required. Defensive handling belongs _before_ the parse, not after.
  - ❌ BAD: `...(validated.scope !== undefined && { scope: validated.scope })` — `scope` is required in the schema
  - ✅ GOOD: `scope: validated.scope` — the parse already guarantees it
- **No `zodSchema` field carries `.optional()`, regardless of nullability.** `defineTable()` (`db/util/schema/define-table.ts`) returns exactly two schemas: `zodSchema` (one `zod` field per column) and `updateSchema` (built by `generateUpdateSchema`, wrapping every non-primary-key, non-timestamp field `.optional()` via `.partial()`). `zodSchema` is used only as a TypeScript type-inference source (`z.infer<typeof table.zodSchema>` derives the domain type, e.g. `Adventure`) — it is never runtime-parsed against a read row anywhere in this codebase. There is no create-time schema: every domain's `create.ts` builds its own ad hoc typed object literal passed directly to `buildCreateQuery`, independent of `zodSchema` or `updateSchema`. `.optional()` on a `zodSchema` field misrepresents the derived domain type: a `SELECT *` row always has every column key present — a nullable column's absent value is SQL `NULL`, mapped to JS `null`, never `undefined` — so `.optional()` makes TypeScript treat a field as possibly-missing when it never is. Never add `.optional()` to a `zodSchema` field: use `.nullable()` alone for nullable columns, no modifier for `NOT NULL` columns (including `NOT NULL DEFAULT x` — the default is a SQL-layer concern with no `zodSchema` involvement, since `create.ts` never reads `zodSchema`).
  - ❌ BAD: `active_view: z.enum(['prep', 'run']).optional()` on `zodSchema` — allows `undefined` in the derived `Session` type, misrepresenting `NOT NULL`
  - ❌ BAD: `bio: z.string().nullable().optional()` on `zodSchema` — a nullable column's read value is `null`, never `undefined`; `.optional()` adds a type-level possibility that never occurs
  - ✅ GOOD: `active_view: z.enum(['prep', 'run'])` on `zodSchema`
  - ✅ GOOD: `bio: z.string().nullable()` on `zodSchema`
  - **Exception — pre-existing debt:** the 10 schema files that already use `.optional()` on a `zodSchema` field as of this rule landing are grandfathered. Converting an existing field (optional key → required-but-nullable key) is not mechanical — it changes the derived domain type and ripples into every consumer. The shared rules file's Best Practices & Code Quality rule beginning "When editing a file for an unrelated task, fix convention violations..." does not apply to this specific pattern: do not proactively convert an existing `.optional()` field as a side effect of touching its schema file for an unrelated reason. This rule applies unconditionally to new columns and to any field intentionally rewritten as part of a deliberate, reviewed migration of that domain's schema.

### Default Placement Hierarchy

Place defaults as close to the database as possible. Use this hierarchy:

1. **SQL schema** (`DEFAULT` clause in `schema.ts`) — for short static strings (e.g. `'active'`) and numeric literals. These are single-value constants the DB can own entirely.
2. **`create.ts`** — for any default that cannot be expressed as a SQL literal: computed strings (e.g. `'New Adventure ' + readableDatetimeString()`), and timestamps (e.g. `new Date().toISOString()` for `created_at` / `updated_at` — SQLite's `CURRENT_TIMESTAMP` produces `YYYY-MM-DD HH:MM:SS`, which is not ISO 8601 UTC).

**Exception:** Stringified JSON that is interpreted by a downstream consumer (e.g. a rich-text editor) belongs in `create.ts` even when the value is a static string. The schema is not the right owner for content whose structure is defined by an external component. This exception governs placement even when the value is also a `Record<DomainType, string>` lookup table keyed by a `domain/` type that would otherwise fall under `app/domain/CLAUDE.md` — What Belongs Here's constant-lookup-table rule: a value that is genuinely a DB column default is placed by this hierarchy, never relocated to `domain/` on the basis of being keyed by a domain type. `domain/CLAUDE.md`'s rule governs a lookup table's placement only when the table's value is not itself a DB default (e.g. a route-segment or display-label lookup).

Never place defaults in the service layer or frontend. A default that travels up the call stack has left the layer that owns the schema contract.

- ❌ BAD: `adventureService.create()` supplies `name: 'New Adventure ' + readableDatetimeString()` and passes it to `adventure.create()`
- ✅ GOOD: `adventure/create.ts` computes `name: 'New Adventure ' + readableDatetimeString()` when `input.name` is absent
- ❌ BAD: Schema column `status TEXT NOT NULL` with no `DEFAULT` — service passes `'active'` on every call
- ✅ GOOD: Schema column `status TEXT NOT NULL DEFAULT 'active'` — no caller involvement needed

### INSERT Best Practice

Only specify required fields in INSERT statements. Let the database handle NULL for omitted optional columns:

```typescript
// ✅ GOOD - Only required fields
await db.execute(
  'INSERT INTO base_entities (id, adventure_id, entity_type, name) VALUES ($1, $2, $3, $4)',
  [id, validated.adventure_id, validated.entity_type, validated.name],
);

// ❌ BAD - Explicit NULL for every optional field
await db.execute(
  'INSERT INTO base_entities (id, adventure_id, entity_type, name, image_id, pinned_order) VALUES ($1, $2, $3, $4, $5, $6)',
  [
    id,
    validated.adventure_id,
    validated.entity_type,
    validated.name,
    validated.image_id ?? null,
    validated.pinned_order ?? null,
  ],
);
```

## Naming

- Use short, generic CRUD names: `create`, `get`, `getAll`, `update`, `remove` (since `delete` is a reserved keyword)
- Import as namespace in consuming files: `import * as tableName from '@db/tableName'`
- `@db/domainName` is the expected import depth for **all consumers** — including type imports from the frontend. Never reach into `@db/domainName/types` or deeper.
- Usage example: `session.create()`, `session.getAll()`, `session.update()`
- File names match function names: `create.ts`, `get.ts`, `get-all.ts`, `update.ts`, `remove.ts`. This list applies only to files that implement a single CRUD operation. Non-CRUD files — schema definitions, derived types, shared utilities — are named by their concern (e.g., `schema.ts`, `types.ts`). The root CLAUDE.md `1 concern → 1 file` rule governs these.

## Duplication

Domains that support duplication (see `db/<domain>/duplicate.ts`) share one column-copying mechanism: `buildDuplicateQuery` (`db/util/build-duplicate-query.ts`). Never compose `buildCreateQuery` + `generateDbTimestamps` directly for a duplicate operation — that bypasses the shared contract and has already produced divergent implementations once.

`duplicate.ts` always follows this shape: `assertValidId` the source id, fetch the source row, generate a new id, then destructure the source row to build `copiedColumns` — excluding `id`, `created_at`, and `updated_at` unconditionally (`buildDuplicateQuery` supplies the id and generates fresh timestamps itself), plus any column that must differ in the duplicate (e.g. `image_id` when the image itself is duplicated separately). Columns excluded from `copiedColumns` are re-supplied via the `overrides` argument — an excluded column with no override is omitted from the INSERT and takes its SQL default. Reference: `db/base-entity/duplicate.ts` + `db/util/build-duplicate-query.ts`.

- ✅ GOOD: `const { id: _id, name: _name, image_id: _imageId, pinned_order: _pinnedOrder, created_at: _createdAt, updated_at: _updatedAt, ...copiedColumns } = source; buildDuplicateQuery('base_entities', newId, copiedColumns, { image_id: newImageId })`
- ❌ BAD: hand-rolling `buildCreateQuery(tableName, newId, { ...source, id: newId, ...generateDbTimestamps() })` — reimplements the exclude-then-spread contract per domain instead of delegating to `buildDuplicateQuery`

## Cross-table utilities

Functions that operate across multiple tables (e.g., `mention-search.ts`) live as flat files at the db root, not in a domain subdirectory. This is a deliberate exception to the "group by table" convention — cross-table concerns have no single domain owner.

## Seeds

With the migration system in place, initial data rows for new domain tables belong in the migration
that creates the table — not in a separate `seed.ts` file. The `seedTableConfig` pattern is legacy.
Do not replicate it for new tables.

## Migrations

Every schema change (ADD COLUMN, DROP COLUMN, change column constraint, new table, dropped table) requires a new migration file in `db/_migrations/`. Never alter `createTableSQL` in a `schema.ts` without a corresponding migration file.

Migration file naming: `{ms_timestamp}_{description}.ts`, where the timestamp is `Date.now()` at the time of file creation, assigned once and never changed. Timestamps must be unique.

Each migration file exports a named const with shape `{ id: string, up: (db: Database) => Promise<void> }`. The `id` must match the timestamp in the file name. After creating the file, add it to the `migrations` array in `db/_migrations/index.ts` in ascending timestamp order.

All migrations must be idempotent — not only against being re-run after the ledger already recorded them, but against being resumed after a partial failure mid-`up()`, since no cross-statement atomicity is achievable through `tauri-plugin-sql`'s `execute()`/`select()` API at all. Each call checks out an arbitrary connection from a 10-connection pool with no session pinning across calls and no config surface to change this, so a raw-SQL `BEGIN`/`COMMIT` wrapper spanning multiple `execute()` calls guarantees nothing — a statement that already committed stays committed if a later statement in the same migration fails, and a connection left mid-transaction by a raw `BEGIN` returns to the pool with no automatic rollback, since sqlx's own rollback-on-drop only covers transactions opened via its `Connection::begin()` API, never raw SQL text sent through `execute()`. The `_migrations` ledger guarantees a completed migration's `up()` never re-runs; it guarantees nothing about a migration that fails partway through, so it is never sufficient idempotency on its own for any statement shape — every statement in `up()` must be independently safe to re-issue: `CREATE TABLE IF NOT EXISTS` / `CREATE TRIGGER IF NOT EXISTS` / `CREATE INDEX IF NOT EXISTS` for creation statements (see `1786186021664_add_encounters.ts`, `1784365870026_add_sync_infrastructure.ts`); `INSERT ... SELECT ... WHERE NOT EXISTS`, keyed on a real unique column and never on a freshly generated `id` (which differs per retry), for row inserts — prefer `ON CONFLICT DO NOTHING` against a real unique constraint when the table already carries one, but use `WHERE NOT EXISTS` instead whenever the insert must be idempotent before that constraint exists, since `ON CONFLICT` targets a constraint that must already be defined at the time the migration runs (see `1780099200000_seed_table_config.ts`, which necessarily predates the unique index `1787825905519_add_table_config_unique_index.ts` later adds); `ensureColumn` (`db/util/ensure-column.ts` — a `PRAGMA table_info` existence check before the `ALTER TABLE ... ADD COLUMN` call) for column additions, since `ADD COLUMN` has no `IF NOT EXISTS` form. For column-level changes involving a temp table, additionally use `DROP TABLE IF EXISTS` on the temp table before creating it.

The `_migrations` table is infrastructure owned by `database.ts`. Never reference or modify it in domain code or migrations.

**Migration-file duplication is required, not a DRY violation.** A migration must never depend on a live, mutable source — a shared registry, a shared helper function, or any other value that can change after this migration has already run — for a literal or logic it needs, since a later edit to that source would retroactively change an already-applied migration's behavior. When a migration needs a literal or logic that also exists in a live source, freeze a local copy inside the migration file instead, and add an inline comment stating what was frozen, where the live equivalent lives, and why (a migration must never depend on a shared source). This duplication is exempt from root CLAUDE.md's duplicate-raw-literal DRY rule: the frozen copy and its live counterpart are not the same call site under that rule's own test, since the frozen copy is pinned to the moment the migration ran and the live source is expected to diverge from it afterward. Precedent: `1784365870026_add_sync_infrastructure.ts` and `1784896762609_backfill_sync_changes.ts` each freeze their own copy of `SYNCED_TABLE_NAMES`; `1786186021664_add_encounters.ts` freezes both the trigger-SQL shape `buildTriggerSQL` produces and its own copy of `db/encounter/schema.ts`'s `createTableSQL`; `1779321600000_initial_schema.ts` and `1789304154994_add_base_entities.ts` each freeze a domain schema module's `createTableSQL` too (`db/base-entity/schema.ts`'s, in the latter case) — a schema module's own SQL-generating export is exactly the kind of value the catch-all above already covers.

## Testing

Every public function in a domain directory (`create`, `get`, `getAll`, `update`, `remove`) must have a corresponding test file in a `__tests__/` subdirectory within that domain directory. See `db/adventure/__tests__/` and `db/session/__tests__/` as reference implementations.

Every test file that calls `vi.mock('@tauri-apps/plugin-sql', ...)` at module scope must reset module registry between tests. Default: `afterEach(() => { vi.resetModules(); })` with a static top-level import of the function under test — this is correct for domain CRUD test files (see `db/adventure/__tests__/`, `db/session/__tests__/`), where `getDatabase()` is incidental plumbing and every assertion targets `mockExecute`/`mockSelect` call history, which `vi.clearAllMocks()` already resets per test regardless of whether the module-level `db` cache survives across tests. The stricter pattern — `vi.resetModules()` in `beforeEach` plus `await import('../moduleName')` dynamically inside each test body, never a static top-level import — applies only when the test suite itself asserts on `initDatabase`'s or `getDatabase`'s own initialization-or-caching behavior (e.g. `db/__tests__/init-database.test.ts`, where each test expects the full migration-running path to re-fire on every call): there, a stale cached `db` left over from a prior test would silently short-circuit that path and falsify the assertion. Static imports at module scope capture the singleton at load time, so the stricter pattern is required whenever a leftover cached instance would falsify the test's own assertions — not merely whenever a code path happens to touch the singleton.

Every test that calls `getDatabase()` exercises the full database init path, which runs migrations. The migration runner calls `database.select()` to check applied migrations. If `mockSelect.mockResolvedValue([])` is not set before `getDatabase()` is called, the init will crash. Any test file that invokes `getDatabase()` — directly or indirectly — must call `mockSelect.mockResolvedValue([])` in its `beforeEach` block before any other setup.
