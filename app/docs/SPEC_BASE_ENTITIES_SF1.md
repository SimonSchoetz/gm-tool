# SF1 — Freeze migration schema SQL

Replace every live schema-module import in the two applied migrations that have one with a frozen SQL literal equal to what that schema module generates today, so later sub-features can delete per-type schema files without breaking fresh installs (KAD: Migrations never import live schema modules).

## Files affected

Modified:

- `app/db/_migrations/1779321600000_initial_schema.ts` — remove all eleven `../<domain>/schema` imports; execute frozen SQL literals instead of `xTable.createTableSQL`
- `app/db/_migrations/1786186021664_add_encounters.ts` — remove the `encounterTable` import; execute a frozen SQL literal instead of `encounterTable.createTableSQL`

New: none

Moved: none

Draft: none

## Database

### `1779321600000_initial_schema.ts`

Keep the export (`initialSchemaMigration`, id `'1779321600000'`) and the execution order unchanged: images, adventures, sessions, session_steps, npcs, foes, items, locations, factions, pcs, table_config.

Declare module-local frozen constants, one per standalone table, plus one module-local builder `legacyEntityTableSQL(tableName: string): string` for the six identical entity tables (a migration-local helper is permitted — `1784365870026_add_sync_infrastructure.ts`'s `buildTriggerSQL` is the precedent). Place one single-line comment above the constants: it states that each literal is a frozen copy of what `db/<domain>/schema.ts`'s `createTableSQL` produced when this file was frozen, and that a migration must never depend on a live schema module (see `app/db/CLAUDE.md` — Migrations).

Every statement has the form `CREATE TABLE IF NOT EXISTS <name> (<definitions>)`. The substring `CREATE TABLE IF NOT EXISTS sessions` must appear with single spaces exactly as written — `app/db/__tests__/init-database.test.ts` asserts it. Column definitions, in order, followed by foreign-key clauses:

| Table | Definitions |
| --- | --- |
| `images` | `id TEXT PRIMARY KEY`, `file_extension TEXT NOT NULL`, `original_filename TEXT`, `file_size INTEGER`, `frame_x REAL`, `frame_y REAL`, `frame_zoom REAL`, `created_at TEXT NOT NULL`, `updated_at TEXT NOT NULL` |
| `adventures` | `id TEXT PRIMARY KEY`, `name TEXT`, `description TEXT`, `image_id TEXT`, `created_at TEXT NOT NULL`, `updated_at TEXT NOT NULL`, `FOREIGN KEY (image_id) REFERENCES images(id) ON DELETE SET NULL` |
| `sessions` | `id TEXT PRIMARY KEY`, `name TEXT`, `description TEXT`, `summary TEXT`, `session_date TEXT`, `active_view TEXT NOT NULL DEFAULT 'prep'`, `adventure_id TEXT NOT NULL`, `pinned_order INTEGER`, `created_at TEXT NOT NULL`, `updated_at TEXT NOT NULL`, `FOREIGN KEY (adventure_id) REFERENCES adventures(id) ON DELETE CASCADE` |
| `session_steps` | `id TEXT PRIMARY KEY`, `session_id TEXT NOT NULL`, `name TEXT`, `content TEXT`, `default_step_key TEXT`, `checked INTEGER NOT NULL DEFAULT 0`, `sort_order INTEGER NOT NULL`, `created_at TEXT NOT NULL`, `updated_at TEXT NOT NULL`, `FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE` |
| `legacyEntityTableSQL(tableName)` — called with `'npcs'`, `'foes'`, `'items'`, `'locations'`, `'factions'`, `'pcs'` | `id TEXT PRIMARY KEY`, `adventure_id TEXT NOT NULL`, `name TEXT`, `summary TEXT`, `description TEXT`, `image_id TEXT`, `pinned_order INTEGER`, `created_at TEXT NOT NULL`, `updated_at TEXT NOT NULL`, `FOREIGN KEY (adventure_id) REFERENCES adventures(id) ON DELETE CASCADE`, `FOREIGN KEY (image_id) REFERENCES images(id) ON DELETE SET NULL` |
| `table_config` | `id TEXT PRIMARY KEY`, `table_name TEXT NOT NULL`, `color TEXT NOT NULL`, `tagging_enabled INTEGER NOT NULL DEFAULT 1`, `scope TEXT NOT NULL DEFAULT 'adventure'`, `layout TEXT NOT NULL`, `created_at TEXT NOT NULL`, `updated_at TEXT NOT NULL` |

These definitions are what `defineTable` (`app/db/util/schema/define-table.ts:64-94`) generates from each current `schema.ts`: `name TYPE`, then `PRIMARY KEY`, `NOT NULL`, `DEFAULT x` in that order, then all `FOREIGN KEY` clauses after the columns. `sessions` and the six entity tables include `pinned_order` because today's schemas do; the later `1786002768594_add_pinned_order.ts` migration's `ensureColumn` already skips an existing column, so a fresh install ends in exactly today's state. `legacyEntityTableSQL` interpolates `tableName`; its call sites pass only the six fixed literals above — state that in a single-line comment on the builder, mirroring `1784896762609_backfill_sync_changes.ts:20`.

### `1786186021664_add_encounters.ts`

Replace `import { encounterTable } from '../encounter/schema';` and `await db.execute(encounterTable.createTableSQL);` with a module-local frozen constant executed in the same position. Definitions, in order: `id TEXT PRIMARY KEY`, `adventure_id TEXT NOT NULL`, `name TEXT`, `description TEXT`, `pinned_order INTEGER`, `created_at TEXT NOT NULL`, `updated_at TEXT NOT NULL`, `FOREIGN KEY (adventure_id) REFERENCES adventures(id) ON DELETE CASCADE`. Merge the frozen-copy rationale into the file's existing comment style: one single-line comment above the constant, stating that it freezes what `db/encounter/schema.ts`'s `createTableSQL` produced, for the same reason the trigger SQL below is frozen. Everything else in the file is unchanged.

### Modified-file scan

Neither file contains JSX, so neither can hold an inline sub-component, and neither has a `void`-typed function returning `null`. No other convention violation was found in either file.
