# Database

## Structure

db/
├── database.ts # Init, table registration, migrations
├── util/ # Schema builder (defineTable)
├── adventure/ # schema, types, CRUD, index
├── session/
├── npc/
├── image/
└── table-config/ # includes seed.ts

**Schema source of truth:** Each domain's `schema.ts` defines the table via `defineTable()`. Don't maintain a separate schema list — read the `schema.ts` files directly.

## Conventions

Follows the global file organization conventions from the root CLAUDE.md, plus:

- All functions for 1 table should be grouped in a directory
- Defensive input validation with clear error messages
- All tables have at least the following columns:
  - `id` as PK (created with nanoid)
  - `created_at`
  - `updated_at`
- **Naming consistency**: All entities use `name` as the primary identifier column
  - Use `name`, not `title`, `label`, or other variations
  - Example: `adventures.name`, `npcs.name`, `sessions.name`
  - This creates consistency across the database schema
- **No unrequested schema columns**: Never add a column that was not explicitly discussed. If you believe an additional column is necessary, explain why and ask for approval before adding it.
- **Frontend display is a frontend concern**: Do not add columns for display purposes (e.g. `display_name`) unless explicitly asked. How data is presented is handled in the frontend.
- **JSON string columns must have validated schemas**: When a column stores a JSON-serialised object or array, always:
  1. Define a named schema type (e.g. `TableLayout`) using the project's validation approach
  2. Derive TypeScript types from that schema
  3. Validate the JSON string against that schema in `create` and `update` functions before writing to the DB
  - Never rely on TypeScript types alone to validate data that will be serialised to a string
- **Column relocation means removal**: If instructed to move a field into another structure (e.g. "make `searchable_columns` part of `layout`"), always remove the original column unless explicitly told to keep it.
- **Trust the validated output**: After a successful `schema.parse(data)` call, all non-optional fields are guaranteed to be defined. Never add conditional spreads, nullish coalescing, or optional chaining on fields the schema marks as required. Defensive handling belongs *before* the parse, not after.
  - ❌ BAD: `...(validated.scope !== undefined && { scope: validated.scope })` — `scope` is required in the schema
  - ✅ GOOD: `scope: validated.scope` — the parse already guarantees it

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
- Usage example: `session.create()`, `session.getAll()`, `session.update()`
- File names match function names: `create.ts`, `get.ts`, `get-all.ts`, `update.ts`, `remove.ts`

## Cross-table utilities

Functions that operate across multiple tables (e.g., `mention-search.ts`) live as flat files at the db root, not in a domain subdirectory. This is a deliberate exception to the "group by table" convention — cross-table concerns have no single domain owner.

## Seeds

- Seed files live within their domain directory: `db/table-config/seed.ts`
- Seeds are called from `database.ts` during init (after migrations)
- Seeds are idempotent — they check for existing rows before inserting
- Keep seed data co-located with the table it belongs to, not in `database.ts`
