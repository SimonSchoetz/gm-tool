# Database

## Structure

database
db/
├── database.ts
└── session/

## Database Schema

**Core Tables:**

- `adventures` - Main adventure/campaign records
- `sessions` - Individual game sessions (many-to-one with adventures)

**Relationships:**

- Adventures (1) → (∞) Sessions via `sessions.adventure_id`
- Cascade delete: removing an adventure deletes its sessions

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

## Naming

- Use short, generic CRUD names: `create`, `get`, `getAll`, `update`, `remove` (since `delete` is a reserved keyword)
- Import as namespace in consuming files: `import * as tableName from '@db/tableName'`
- Usage example: `session.create()`, `session.getAll()`, `session.update()`
- File names match function names: `create.ts`, `get.ts`, `get-all.ts`, `update.ts`, `remove.ts`
