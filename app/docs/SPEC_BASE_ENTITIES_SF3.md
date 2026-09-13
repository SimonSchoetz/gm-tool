# SF3 — `base_entities` table

Create the shared db module and its table, move every existing row into it, and point sync and the cross-table queries at it. The six per-type db modules still compile after this SF and are deleted in SF7.

## Files affected

Modified:

- `app/db/_migrations/index.ts` — import `addBaseEntitiesMigration` and append it as the last element of `migrations`
- `app/db/_sync/registry.ts` — replace the six per-type imports and entries with one `base_entities` entry
- `app/db/_sync/__tests__/registry.test.ts` — `ADVENTURE_SCOPED_TABLES` becomes `['sessions', 'base_entities', 'encounters']`; the count test's title becomes `'should include all 7 synced tables with unique names'` and both assertions change from `12` to `7`
- `app/db/_sync/apply-upsert.ts` — `table_config` gate uses `isEntityType`; remove `SYNCED_TABLE_NAMES` from the `./registry` import
- `app/db/_sync/__tests__/apply-upsert.test.ts` — rename `NPC_ROW` to `BASE_ENTITY_ROW` and add `entity_type: 'npcs'` to it; change the table argument from `'npcs'` to `'base_entities'` in every row-level test (the calls at lines 63, 75, 86, 96, 105, 116, 124, 135, 196); change the title of the test at line 174 to `'should skip a table_config row whose table_name is not an entity type'`; the two `table_config` tests keep `table_name: 'npcs'` and `'npcs; DROP TABLE adventures'` and their assertions
- `app/db/_sync/__tests__/apply-delete.test.ts` — table argument `'npcs'` → `'base_entities'` (lines 62, 75, 96); `'DELETE FROM npcs WHERE id = $1'` → `'DELETE FROM base_entities WHERE id = $1'` (lines 81, 103)
- `app/db/_sync/__tests__/get-row-by-id.test.ts` — table argument `'npcs'` → `'base_entities'` (lines 40, 52); `'SELECT * FROM npcs WHERE id = $1'` → `'SELECT * FROM base_entities WHERE id = $1'` (line 43)
- `app/db/mention-search.ts` — base-entity branch in both functions; parameter renamed `entityType`
- `app/db/__tests__/mention-search.test.ts` — base and non-base cases per function (listed below)
- `app/db/pinned-order.ts` — base-entity branch in both functions; parameter renamed `entityType`
- `app/db/__tests__/pinned-order.test.ts` — base and non-base cases per function (listed below)

New:

- `app/db/base-entity/schema.ts`
- `app/db/base-entity/types.ts`
- `app/db/base-entity/create.ts`
- `app/db/base-entity/get.ts`
- `app/db/base-entity/get-all.ts`
- `app/db/base-entity/update.ts`
- `app/db/base-entity/remove.ts`
- `app/db/base-entity/duplicate.ts`
- `app/db/base-entity/index.ts`
- `app/db/base-entity/__tests__/create.test.ts`
- `app/db/base-entity/__tests__/get.test.ts`
- `app/db/base-entity/__tests__/get-all.test.ts`
- `app/db/base-entity/__tests__/update.test.ts`
- `app/db/base-entity/__tests__/remove.test.ts`
- `app/db/base-entity/__tests__/duplicate.test.ts`
- `app/db/_migrations/{timestamp}_add_base_entities.ts` — `{timestamp}` is `Date.now()` at file creation, per `app/db/CLAUDE.md` — Migrations

Moved: none

Draft: none

No change: `app/db/_sync/get-row-by-id.ts` and `app/db/_sync/apply-delete.ts` validate against `SYNCED_TABLE_NAMES`, which contains `'base_entities'` after the registry change. `app/db/_sync/__tests__/get-changes-since.test.ts` uses `table_name: 'npcs'` only as opaque fixture data returned by a mocked select. `app/services/pinnedOrderService.ts` and `app/services/mentionSearchService.ts` already validate with `isEntityType` and pass the type through unchanged.

## Database

### `base-entity/schema.ts`

`export const baseEntityTable = defineTable({ name: 'base_entities', columns: { … } })`. Import `z` from `'zod'`, `defineTable` from `'../util'`, and `BASE_ENTITY_TYPES` from `'@domain'` (the `session-step/schema.ts` precedent imports `LAZY_DM_STEP_KEYS` the same way). Columns in this order (KAD: The schema follows the current `zodSchema` rule):

| Column | Definition | `zod` |
| --- | --- | --- |
| `id` | `type: 'TEXT', primaryKey: true` | `z.string()` |
| `adventure_id` | `type: 'TEXT', notNull: true, foreignKey: { table: 'adventures', column: 'id', onDelete: 'CASCADE' }` | `z.string()` |
| `entity_type` | `type: 'TEXT', notNull: true` | `z.enum(BASE_ENTITY_TYPES)` |
| `name` | `type: 'TEXT'` | `z.string().nullable()` |
| `summary` | `type: 'TEXT'` | `z.string().nullable()` |
| `description` | `type: 'TEXT'` | `z.string().nullable()` |
| `image_id` | `type: 'TEXT', foreignKey: { table: 'images', column: 'id', onDelete: 'SET NULL' }` | `z.string().nullable()` |
| `pinned_order` | `type: 'INTEGER'` | `z.number().nullable()` |
| `created_at` | `type: 'TEXT', notNull: true` | `z.string()` |
| `updated_at` | `type: 'TEXT', notNull: true` | `z.string()` |

No index is added; none of the six legacy tables carries one and none was requested.

### `base-entity/types.ts`

`export type BaseEntity = z.infer<typeof baseEntityTable.zodSchema>;` and `export type UpdateBaseEntityInput = z.infer<typeof baseEntityTable.updateSchema>;` — same shape as `app/db/npc/types.ts`.

### CRUD files

Reference: `app/db/npc/` (validated against `app/db/CLAUDE.md`: explicit barrel, `assertValidId` guards, `buildCreateQuery` / `buildUpdateQuery` / `buildDuplicateQuery` delegation). Differences from the reference:

| File | Signature | Guard | Query |
| --- | --- | --- | --- |
| `create.ts` | `create(entityType: BaseEntityType, adventureId: string): Promise<string>` | `assertValidId(adventureId, 'adventure')` | `buildCreateQuery<{ adventure_id: string; entity_type: BaseEntityType; name: string; summary: string; created_at: string; updated_at: string }>('base_entities', id, { adventure_id: adventureId, entity_type: entityType, name, summary: SUMMARY_TEMPLATES[entityType], ...timestamps })` |
| `get.ts` | `get(entityType: BaseEntityType, id: string): Promise<BaseEntity \| null>` | `assertValidId(id, 'Base entity')` | `'SELECT * FROM base_entities WHERE id = $1 AND entity_type = $2'`, `[id, entityType]` |
| `get-all.ts` | `getAll(entityType: BaseEntityType, adventureId: string): Promise<BaseEntity[]>` | `assertValidId(adventureId, 'Adventure')` | `'SELECT * FROM base_entities WHERE adventure_id = $1 AND entity_type = $2 ORDER BY created_at DESC'`, `[adventureId, entityType]` |
| `update.ts` | `update(id: string, data: UpdateBaseEntityInput): Promise<void>` | `assertValidId(id, 'Base entity')`, `assertHasUpdateFields(data)` | `baseEntityTable.updateSchema.parse(data)`, then `buildUpdateQuery('base_entities', id, validated)` |
| `remove.ts` | `remove(id: string): Promise<void>` | `assertValidId(id, 'Base entity')` | `'DELETE FROM base_entities WHERE id = $1'`, `[id]` |
| `duplicate.ts` | `duplicate(entityType: BaseEntityType, sourceId: string, imageId: string \| null): Promise<string>` | `assertValidId(sourceId, 'Base entity')` | source via `get(entityType, sourceId)`; missing source throws `` new Error(`${entityTypeLabel(entityType)} not found: ${sourceId}`) `` (an internal invariant, exempt from the factory pattern); exclude `id`, `name`, `image_id`, `pinned_order`, `created_at`, `updated_at` into `copiedColumns`; `buildDuplicateQuery('base_entities', id, copiedColumns, { image_id: imageId })` |

`create.ts` details (KADs: Summary templates live in the db create module; Labels derive from `entityTypeLabel`):

- Default name: `` `New ${entityTypeLabel(entityType)} ${getDateTimeString(now)}` ``.
- Module-private `SUMMARY_TEMPLATES: Record<BaseEntityType, string>` holding the six existing `templates.summary` strings copied verbatim from `app/db/npc/create.ts` (`npcs`), `app/db/pc/create.ts` (`pcs`), `app/db/foe/create.ts` (`foes`), `app/db/faction/create.ts` (`factions`), `app/db/location/create.ts` (`locations`), and `app/db/item/create.ts` (`items`).
- Imports: `entityTypeLabel` and `type BaseEntityType` from `'@domain'`; `getDateTimeString` from `'@util'` as today.

`duplicate.ts` and `get-all.ts`/`get.ts` import `type BaseEntityType` (and, for `duplicate.ts`, `entityTypeLabel`) from `'@domain'`.

`index.ts` — explicit named exports (`export *` is banned in `db/`): `create`, `duplicate`, `get`, `getAll`, `update`, `remove`, and `export type { BaseEntity, UpdateBaseEntityInput } from './types';`.

### Migration `{timestamp}_add_base_entities.ts`

Export `addBaseEntitiesMigration = { id: '<timestamp>', up }`; the id equals the file name's timestamp. Nothing in the file imports from a live module except `type Database` (KAD: Migrations never import live schema modules). Module-local constants, each with a single-line comment naming what it freezes and why (a migration must never depend on a live source — `app/db/CLAUDE.md` — Migrations):

- `CREATE_BASE_ENTITIES_SQL` — `CREATE TABLE IF NOT EXISTS base_entities (…)` with, in order: `id TEXT PRIMARY KEY`, `adventure_id TEXT NOT NULL`, `entity_type TEXT NOT NULL`, `name TEXT`, `summary TEXT`, `description TEXT`, `image_id TEXT`, `pinned_order INTEGER`, `created_at TEXT NOT NULL`, `updated_at TEXT NOT NULL`, `FOREIGN KEY (adventure_id) REFERENCES adventures(id) ON DELETE CASCADE`, `FOREIGN KEY (image_id) REFERENCES images(id) ON DELETE SET NULL` — a frozen copy of what `db/base-entity/schema.ts` generates.
- `LEGACY_BASE_ENTITY_TABLES = ['npcs', 'pcs', 'foes', 'factions', 'locations', 'items']` — a frozen copy of the entity types `BASE_ENTITY_TYPES` (`domain/entities/entityTypes.ts`) holds; each is also the legacy table whose rows move.

`up(db)` issues, in order (KAD: The data-moving migration):

1. `CREATE_BASE_ENTITIES_SQL`.
2. Three `CREATE TRIGGER IF NOT EXISTS` statements — `trg_sync_base_entities_insert`, `trg_sync_base_entities_update`, `trg_sync_base_entities_delete` — each the literal shape `1786186021664_add_encounters.ts:25-51` writes, with `base_entities` substituted for `encounters` in the trigger name, the `ON` table, the `'<table>:' ||` id prefix, and the `table_name` value.
3. For each `table` of `LEGACY_BASE_ENTITY_TABLES`:
   1. `SELECT name FROM sqlite_master WHERE type = 'table' AND name = $1` with `[table]`.
   2. Only when that select returned at least one row: `INSERT INTO base_entities (id, adventure_id, entity_type, name, summary, description, image_id, pinned_order, created_at, updated_at) SELECT id, adventure_id, $1, name, summary, description, image_id, pinned_order, created_at, updated_at FROM ${table} WHERE true ON CONFLICT(id) DO NOTHING` with `[table]`.
   3. `INSERT INTO _sync_changes (id, table_name, row_id, seq, deleted, deleted_at) SELECT 'base_entities:' || row_id, 'base_entities', row_id, seq, deleted, deleted_at FROM _sync_changes WHERE table_name = $1 AND deleted = 1 ON CONFLICT(id) DO NOTHING` with `[table]`.
   4. `DROP TABLE IF EXISTS ${table}`.
   5. `DELETE FROM _sync_changes WHERE table_name = $1` with `[table]`.

Required single-line comments at their construct: above step 2's triggers, that they precede the copy so every copied row receives a `base_entities` change record (the legacy records are deleted in step 3.5, and a row with no change record never reaches a paired device); above 3.2, that the `sqlite_master` guard keeps a resumed run from selecting a table an earlier attempt already dropped, and that `WHERE true` disambiguates the upsert clause for SQLite's parser; above 3.3, that tombstones keep their original `seq` so a peer that had not yet received the deletion still receives it; above 3.4 and 3.5, that the drop precedes the cleanup so no change record the drop could emit survives; and at each `${table}` interpolation, that the value only ever comes from the fixed local constant (mirrors `1784896762609_backfill_sync_changes.ts:20`).

`app/db/__tests__/init-database.test.ts` runs every migration against a select mock resolving `[]`; with this migration the guard in 3.1 sees no table and 3.2 is skipped, and every other statement goes to the resolving execute mock — the file needs no change. No per-migration test file is added; the codebase has none (`app/db/_migrations/__tests__/` holds only `runMigrations.test.ts`).

### `_migrations/index.ts`

`import { addBaseEntitiesMigration } from './{timestamp}_add_base_entities';` after the `addTableConfigUniqueIndexMigration` import, and `addBaseEntitiesMigration` as the last array element, so `migrationHead` remains the highest id.

### `_sync/registry.ts`

Remove the imports of `npcTable`, `pcTable`, `foeTable`, `factionTable`, `locationTable`, `itemTable`; add `import { baseEntityTable } from '../base-entity/schema';`. In `SYNCED_TABLES`, replace the six entries with `syncedTable('base_entities', baseEntityTable)` in the position `npcs` held (after `sessions`, before `encounters`). The existing ordering comment stays accurate (adventures before every adventure-scoped table; images first).

### `_sync/apply-upsert.ts`

Line 3 becomes `import { SYNCED_TABLES } from './registry';`; add `import { isEntityType } from '@domain/entities';`. In `applyTableConfigUpsert`, the guard becomes `if (typeof tableName !== 'string' || !isEntityType(tableName)) return 'skipped';`, with a single-line comment above it stating that `table_config.table_name` names an entity type — six of which share `base_entities` — so the check is against entity types, not synced table names (KAD: The `table_config` sync gate checks entity types). Existing tests name both paths: `"should match table_config by table_name and delete the differently-id'd loser"` (entity type accepted) and the renamed `'should skip a table_config row whose table_name is not an entity type'` (non-entity string skipped before any query).

### `mention-search.ts`

Rename the first parameter of both functions from `tableName` to `entityType`; import `isBaseEntityType` alongside `isEntityType` from `'@domain/entities'`. The `isEntityType` guard stays first in both functions (KAD: Cross-table modules resolve base entity types to `base_entities`).

`searchByName(entityType, query, adventureId)`, after the guard and `getDatabase()`:

- base entity type, `adventureId !== null`: `SELECT id, name, updated_at FROM base_entities WHERE entity_type = $1 AND name LIKE $2 AND adventure_id = $3 ORDER BY updated_at DESC`, values ``[entityType, `%${query}%`, adventureId]``
- base entity type, `adventureId === null`: `SELECT id, name, updated_at FROM base_entities WHERE entity_type = $1 AND name LIKE $2 ORDER BY updated_at DESC`, values ``[entityType, `%${query}%`]``
- any other entity type: the two existing interpolated queries, unchanged

`getById(entityType, id)`, after the guard and `getDatabase()`:

- base entity type: `SELECT id, name, updated_at FROM base_entities WHERE entity_type = $1 AND id = $2`, `[entityType, id]`
- any other entity type: the existing interpolated query, unchanged

Update both interpolation comments to state that interpolation now happens only for non-base entity types, still made safe by the `isEntityType` guard.

### `pinned-order.ts`

Rename `tableName` to `entityType` in both functions; import `isBaseEntityType` from `'@domain/entities'`.

- `getMaxPinnedOrder(entityType, entityId)`, base entity type: `SELECT MAX(pinned_order) as max_order FROM base_entities WHERE pinned_order IS NOT NULL AND entity_type = $2 AND adventure_id = (SELECT adventure_id FROM base_entities WHERE id = $1)`, `[entityId, entityType]` — `$2` textually preceding `$1` is safe because sqlx binds by parameter number [spec-writer_17: .claude/knowledge/sqlite.md — "sqlx-sqlite binds a reused `$N` placeholder by parameter number, not by occurrence order"]; other entity types: the existing interpolated query.
- `setPinnedOrder(entityType, id, pinnedOrder)`, base entity type: `UPDATE base_entities SET pinned_order = $1 WHERE id = $2`, `[pinnedOrder, id]`; other entity types: the existing interpolated statement (KAD: Reads filter by entity type; writes address the row by id).

Update both interpolation comments to state that only non-base entity types are interpolated.

### Tests

Setup for every new test file follows the matching file in `app/db/npc/__tests__/` (module-scope `@tauri-apps/plugin-sql` mock, `vi.resetModules()` in `afterEach`, fake timers where the reference uses them). Every `BaseEntity`-typed fixture lists all ten columns, since no field is optional.

`base-entity/__tests__/create.test.ts`:

- `create('npcs', 'adventure-123')` returns `'test-generated-id'` and executes SQL containing `'INSERT INTO base_entities'`
- values are exactly `['test-generated-id', 'adventure-123', 'npcs', expect.stringMatching(/^New NPC /), expect.stringContaining('"type":"root"'), '2024-01-15T10:30:00.000Z', '2024-01-15T10:30:00.000Z']`
- `create('pcs', 'adventure-123')` writes a name matching `/^New PC /`
- `create('factions', 'adventure-123')` writes a summary containing `'Leader | Type | Alignment'`
- `create('npcs', '')` rejects with `'Valid adventure ID is required'` and never executes

`base-entity/__tests__/get.test.ts`:

- `get('npcs', 'test-id')` selects `'SELECT * FROM base_entities WHERE id = $1 AND entity_type = $2'` with `['test-id', 'npcs']` and returns the row
- returns `null` when no row matches
- rejects with `'Valid Base entity ID is required'` for `''` and for `'   '`

`base-entity/__tests__/get-all.test.ts`:

- `getAll('npcs', 'adv-1')` selects `'SELECT * FROM base_entities WHERE adventure_id = $1 AND entity_type = $2 ORDER BY created_at DESC'` with `['adv-1', 'npcs']` and returns the rows
- returns `[]` when no rows exist
- rejects with `'Valid Adventure ID is required'` for `''` and for `'   '`

`base-entity/__tests__/update.test.ts`:

- `update('test-id', { name: 'Updated NPC' })` executes `'UPDATE base_entities SET name = $1, updated_at = $2 WHERE id = $3'` with `['Updated NPC', '2024-01-15T10:30:00.000Z', 'test-id']`
- `update('test-id', { name: 'New Name', summary: 'New summary' })` executes `'UPDATE base_entities SET name = $1, summary = $2, updated_at = $3 WHERE id = $4'` with `['New Name', 'New summary', '2024-01-15T10:30:00.000Z', 'test-id']`
- rejects with `'Valid Base entity ID is required'` for `''` and for `'   '`, never executing
- `update('test-id', {})` rejects with `'At least one field must be provided for update'`, never executing

`base-entity/__tests__/remove.test.ts`:

- `remove('test-id')` executes `'DELETE FROM base_entities WHERE id = $1'` with `['test-id']`
- rejects with `'Valid Base entity ID is required'` for `''` and for `'   '`, never executing

`base-entity/__tests__/duplicate.test.ts` — mock `'../get'` as `get: (entityType: string, id: string) => mockGet(entityType, id) as unknown`; source row `{ id: 'source-npc-id', adventure_id: 'adventure-123', entity_type: 'npcs', name: 'Gundren Rockseeker', summary: 'a dwarf merchant', description: 'Long lost brother', image_id: 'source-image-id', pinned_order: 3, created_at: '2023-05-01T08:00:00.000Z', updated_at: '2023-05-02T08:00:00.000Z' }`; `INSERT_SQL = 'INSERT INTO base_entities (id, adventure_id, entity_type, summary, description, image_id, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)'`:

- fetches the source scoped to the given type: `mockGet` called with `('npcs', 'source-npc-id')`
- omits `name`: executes `INSERT_SQL`, and never SQL matching `/^INSERT INTO base_entities \([^)]*\bname\b/`
- copies every other source column: values `['new-npc-id', 'adventure-123', 'npcs', 'a dwarf merchant', 'Long lost brother', 'new-image-id', '2024-01-15T10:30:00.000Z', '2024-01-15T10:30:00.000Z']`
- writes the passed image id, not the source's: values contain `'new-image-id'` and not `'source-image-id'`
- writes a `null` image id when passed `null`: values `['new-npc-id', 'adventure-123', 'npcs', 'a dwarf merchant', 'Long lost brother', null, '2024-01-15T10:30:00.000Z', '2024-01-15T10:30:00.000Z']`
- generates a fresh id and timestamps: returns `'new-npc-id'`, values as in "copies every other source column"
- throws `'NPC not found: missing-npc-id'` when `mockGet` resolves `null` for `duplicate('npcs', 'missing-npc-id', null)`
- omits `pinned_order`: never SQL matching `/^INSERT INTO base_entities \([^)]*\bpinned_order\b/`

`app/db/__tests__/mention-search.test.ts` (one named test per path, per function):

- base, adventure-scoped: `searchByName('npcs', 'gob', 'adv-1')` selects the base adventure-scoped query with `['npcs', '%gob%', 'adv-1']` and returns the rows (replaces the current `'npcs'` scoped test)
- base, unscoped: `searchByName('npcs', 'gob', null)` selects the base unscoped query with `['npcs', '%gob%']`
- non-base, adventure-scoped: `searchByName('sessions', 'ses', 'adv-1')` selects `'SELECT id, name, updated_at FROM sessions WHERE name LIKE $1 AND adventure_id = $2 ORDER BY updated_at DESC'` with `['%ses%', 'adv-1']`
- non-base, unscoped: the existing `searchByName('adventures', 'tav', null)` test, unchanged
- the existing empty-result test (`'npcs'`) and non-entity test (`'table_config'`), unchanged
- base `getById('npcs', '1')` selects `'SELECT id, name, updated_at FROM base_entities WHERE entity_type = $1 AND id = $2'` with `['npcs', '1']` and returns the row (replaces the current `'npcs'` test)
- non-base `getById('sessions', 's-1')` selects `'SELECT id, name, updated_at FROM sessions WHERE id = $1'` with `['s-1']`
- the existing null-result test (`'npcs'`) and non-entity test, unchanged

`app/db/__tests__/pinned-order.test.ts`:

- base `getMaxPinnedOrder('npcs', 'npc-1')` selects the base query above with `['npc-1', 'npcs']` and returns `4` (replaces the current scoping test)
- non-base `getMaxPinnedOrder('sessions', 'session-1')` selects `'SELECT MAX(pinned_order) as max_order FROM sessions WHERE pinned_order IS NOT NULL AND adventure_id = (SELECT adventure_id FROM sessions WHERE id = $1)'` with `['session-1']`
- the existing `null` test (`'npcs'`), unchanged
- base `setPinnedOrder('npcs', 'npc-1', 3)` executes `'UPDATE base_entities SET pinned_order = $1 WHERE id = $2'` with `[3, 'npc-1']`; base unpin with `null` executes the same SQL with `[null, 'npc-1']` (both replace the current tests)
- non-base `setPinnedOrder('sessions', 'session-1', 2)` executes `'UPDATE sessions SET pinned_order = $1 WHERE id = $2'` with `[2, 'session-1']`

### Cross-SF consumers

- `app/db/base-entity` barrel (`create`, `get`, `getAll`, `update`, `remove`, `duplicate`, `BaseEntity`, `UpdateBaseEntityInput`) — SF4 `app/services/baseEntityService.ts` (`import * as baseEntityDb from '@db/base-entity'`; `import type { BaseEntity, UpdateBaseEntityInput } from '@db/base-entity'`)
- `BaseEntity` type — SF5 `useBaseEntities.ts` / `useBaseEntity.ts`; SF6 `BaseEntitiesScreen.tsx` (`import type { BaseEntity } from '@db/base-entity'`)

### Modified-file scan

None of the modified db files contains JSX or a `void`-context `return null`. `pinned-order.ts` and `mention-search.ts` parameter names now match their contents (entity types, not table names). No other violation found.
