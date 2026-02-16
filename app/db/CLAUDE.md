# Database

## Structure

db/
├── database.ts              # Init, table registration, migrations
├── util/                    # Schema builder (defineTable)
├── adventure/               # schema, types, CRUD, index
├── session/
├── npc/
├── image/
└── table-config/            # includes seed.ts

**Schema source of truth:** Each domain's `schema.ts` defines the table via `defineTable()`. Don't maintain a separate schema list — read the `schema.ts` files directly.

## Conventions

- 1 function -> 1 file
- all functions for 1 table should be grouped in a directory
- export via barrel file
- Defensive input validation with clear error messages.
- tests should mirror the file structure
- all tables have at least the following columns:
  - `id` as PK (created with nanoid)
  - `created_at`
  - `updated_at`
- **Naming consistency**: All entities use `name` as the primary identifier column
  - Use `name`, not `title`, `label`, or other variations
  - Example: `adventures.name`, `npcs.name`, `sessions.name`
  - This creates consistency across the database schema

### INSERT Best Practice

Only specify required fields in INSERT statements. Let the database handle NULL for omitted optional columns:

```typescript
// ✅ GOOD - Only required fields
await db.execute(
  'INSERT INTO npcs (id, adventure_id, name) VALUES ($1, $2, $3)',
  [id, validated.adventure_id, validated.name]
);

// ❌ BAD - Explicit NULL for every optional field
await db.execute(
  'INSERT INTO npcs (id, adventure_id, name, rank, faction) VALUES ($1, $2, $3, $4, $5)',
  [id, validated.adventure_id, validated.name, validated.rank ?? null, validated.faction ?? null]
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

## Seeds

- Seed files live within their domain directory: `db/table-config/seed.ts`
- Seeds are called from `database.ts` during init (after migrations)
- Seeds are idempotent — they check for existing rows before inserting
- Keep seed data co-located with the table it belongs to, not in `database.ts`
