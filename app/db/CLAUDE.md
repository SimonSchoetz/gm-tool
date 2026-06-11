# Database

## Structure

db/
├── \_migrations/ # Migration runner and migration files
├── \_system/ # Infrastructure key-value store
│ ├── schema.ts # Zod schemas and derived types for each key's value shape
│ ├── versioning.ts # Typed accessors for the versioning key (public API)
│ ├── get.ts # Raw SQL utility — internal, not exported from barrel
│ └── update.ts # Raw SQL utility — internal, not exported from barrel
├── database.ts # Init, migration runner call
├── util/ # Schema builder (defineTable)
├── adventure/ # schema, types, CRUD, index
├── session/
├── npc/
├── image/
└── table-config/

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
  - Example: `adventures.name`, `npcs.name`, `sessions.name`
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
- **`NOT NULL DEFAULT x` columns must not carry `.optional()` on their base zod schema.** The base schema represents a read row — every `NOT NULL` column is guaranteed present. `.optional()` belongs only in the auto-generated `createSchema` (produced by `generateCreateSchema`), which wraps defaulted columns automatically. Never add `.optional()` manually to a `NOT NULL` column's base field — fix `generateCreateSchema` instead.
  - ❌ BAD: `active_view: z.enum(['prep', 'run']).optional()` on the base schema — allows `undefined` in read types, misrepresenting `NOT NULL`
  - ✅ GOOD: `active_view: z.enum(['prep', 'run'])` on the base schema; `generateCreateSchema` wraps it automatically

### Default Placement Hierarchy

Place defaults as close to the database as possible. Use this hierarchy:

1. **SQL schema** (`DEFAULT` clause in `schema.ts`) — for short static strings (e.g. `'active'`) and numeric literals. These are single-value constants the DB can own entirely.
2. **`create.ts`** — for any default that cannot be expressed as a SQL literal: computed strings (e.g. `'New Adventure ' + readableDatetimeString()`), and timestamps (e.g. `new Date().toISOString()` for `created_at` / `updated_at` — SQLite's `CURRENT_TIMESTAMP` produces `YYYY-MM-DD HH:MM:SS`, which is not ISO 8601 UTC).

**Exception:** Stringified JSON that is interpreted by a downstream consumer (e.g. a rich-text editor) belongs in `create.ts` even when the value is a static string. The schema is not the right owner for content whose structure is defined by an external component.

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
  'INSERT INTO npcs (id, adventure_id, name) VALUES ($1, $2, $3)',
  [id, validated.adventure_id, validated.name],
);

// ❌ BAD - Explicit NULL for every optional field
await db.execute(
  'INSERT INTO npcs (id, adventure_id, name, rank, faction) VALUES ($1, $2, $3, $4, $5)',
  [
    id,
    validated.adventure_id,
    validated.name,
    validated.rank ?? null,
    validated.faction ?? null,
  ],
);
```

**Benefits:**

- Less maintenance when adding/removing optional fields
- Schema defines what's nullable (single source of truth)
- SQLite automatically sets NULL for unspecified nullable columns
- Cleaner, self-documenting code

## Naming

- Use short, generic CRUD names: `create`, `get`, `getAll`, `update`, `remove` (since `delete` is a reserved keyword)
- Import as namespace in consuming files: `import * as tableName from '@db/tableName'`
- `@db/domainName` is the expected import depth for **all consumers** — including type imports from the frontend. Never reach into `@db/domainName/types` or deeper.
- Usage example: `session.create()`, `session.getAll()`, `session.update()`
- File names match function names: `create.ts`, `get.ts`, `get-all.ts`, `update.ts`, `remove.ts`. This list applies only to files that implement a single CRUD operation. Non-CRUD files — schema definitions, derived types, shared utilities — are named by their concern (e.g., `schema.ts`, `types.ts`). The root CLAUDE.md `1 concern → 1 file` rule governs these.

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

All migrations must be idempotent: use `CREATE TABLE IF NOT EXISTS` for new tables; for column-level changes, use `DROP TABLE IF EXISTS` on any temp table before creating it.

The `_migrations` table is infrastructure owned by `database.ts`. Never reference or modify it in domain code or migrations.

## Testing

Every public function in a domain directory (`create`, `get`, `getAll`, `update`, `remove`) must have a corresponding test file in a `__tests__/` subdirectory within that domain directory. See `db/adventure/__tests__/` and `db/session/__tests__/` as reference implementations.

Every test file that calls `vi.mock('@tauri-apps/plugin-sql', ...)` at module scope must reset module registry between tests. For a **single-test file**, `afterEach(() => { vi.resetModules(); })` is sufficient. For any file with **two or more tests that invoke a function owning module-level singleton state** (e.g. `initDatabase`, `getDatabase`): place `vi.resetModules()` in `beforeEach` instead, and use `await import('../moduleName')` dynamically inside each test body — never import the module statically at the top of the file. Static imports at module scope capture the singleton at load time; `beforeEach` reset with dynamic per-test import is required to re-capture it fresh.

Every test that calls `getDatabase()` exercises the full database init path, which runs migrations. The migration runner calls `database.select()` to check applied migrations. If `mockSelect.mockResolvedValue([])` is not set before `getDatabase()` is called, the init will crash. Any test file that invokes `getDatabase()` — directly or indirectly — must call `mockSelect.mockResolvedValue([])` in its `beforeEach` block before any other setup.
