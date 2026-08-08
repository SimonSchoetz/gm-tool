# SF1 — DB layer: `encounters` table, CRUD, migration, sync registration

Creates the `encounters` table module, its migration (table + sync triggers + table-config row), and registers the table with the sync infrastructure.

## Files affected

New:

- `app/db/encounter/schema.ts`
- `app/db/encounter/types.ts`
- `app/db/encounter/create.ts`
- `app/db/encounter/get.ts`
- `app/db/encounter/get-all.ts`
- `app/db/encounter/update.ts`
- `app/db/encounter/remove.ts`
- `app/db/encounter/duplicate.ts`
- `app/db/encounter/index.ts`
- `app/db/encounter/__tests__/create.test.ts`
- `app/db/encounter/__tests__/get.test.ts`
- `app/db/encounter/__tests__/get-all.test.ts`
- `app/db/encounter/__tests__/update.test.ts`
- `app/db/encounter/__tests__/remove.test.ts`
- `app/db/encounter/__tests__/duplicate.test.ts`
- `app/db/_migrations/{timestamp}_add_encounters.ts`

Modified:

- `app/db/_migrations/index.ts` — import and append the new migration
- `app/db/_sync/registry.ts` — add the `encounters` entry
- `app/db/_sync/__tests__/registry.test.ts` — the `'should include all 11 synced tables with unique names'` test asserts `toHaveLength(11)` and `Set(...).size === 11`; both literals and the test title become stale, and `ADVENTURE_SCOPED_TABLES` must gain `'encounters'`
- `app/docs/_product/domain-scaffold.md` — DB-layer corrections, enumerated at the end of this file

## DB changes

### `schema.ts`

Written in full because the `.nullable()` column form is a decision that diverges from every existing domain schema (see the root spec's `zodSchema` decision).

```ts
import { z } from 'zod';
import { defineTable } from '../util';

export const encounterTable = defineTable({
  name: 'encounters',
  columns: {
    id: { type: 'TEXT', primaryKey: true, zod: z.string() },
    adventure_id: {
      type: 'TEXT',
      notNull: true,
      foreignKey: { table: 'adventures', column: 'id', onDelete: 'CASCADE' },
      zod: z.string(),
    },
    name: { type: 'TEXT', zod: z.string().nullable() },
    description: { type: 'TEXT', zod: z.string().nullable() },
    pinned_order: { type: 'INTEGER', zod: z.number().nullable() },
    created_at: { type: 'TEXT', notNull: true, zod: z.string() },
    updated_at: { type: 'TEXT', notNull: true, zod: z.string() },
  },
});
```

Column declaration order is load-bearing: `buildDuplicateQuery` derives the INSERT column list from the source row's key order, which is the `SELECT *` order, which is this order. The `duplicate.test.ts` assertions below assume it.

### `types.ts`, `get.ts`, `get-all.ts`, `update.ts`, `remove.ts`, `index.ts`

Pure substitution from `app/db/foe/` — same file, same structure, same imports. Substitution table:

| Foe symbol | Encounter symbol |
| --- | --- |
| `foeTable` | `encounterTable` |
| `Foe` (type) | `Encounter` |
| `UpdateFoeInput` | `UpdateEncounterInput` |
| `'foes'` (table name in SQL and query builders) | `'encounters'` |
| `assertValidId(id, 'Foe')` | `assertValidId(id, 'Encounter')` |
| `assertValidId(adventureId, 'Adventure')` in `get-all.ts` | unchanged — still `'Adventure'` |

`index.ts` uses explicit named exports (`export *` is banned in `db/`): `create`, `duplicate`, `get`, `getAll`, `update`, `remove`, and `export type { Encounter, UpdateEncounterInput } from './types';`.

### `create.ts`

Follows `app/db/foe/create.ts` with the summary template removed — Encounter has no `summary` column, so the `templates` const and its `summary` entry do not exist. The `buildCreateQuery` type parameter and payload are therefore:

```ts
const { sql, values } = buildCreateQuery<{
  adventure_id: string;
  name: string;
  created_at: string;
  updated_at: string;
}>('encounters', id, {
  adventure_id,
  name,
  ...timestamps,
});
```

`name` is `` `New Encounter ${getDateTimeString(now)}` `` with `now` taken from `const { now, ...timestamps } = generateDbTimestamps();`, and `getDateTimeString` imported from `@util`. The adventure-id guard is `assertValidId(adventure_id, 'adventure')` — lowercase, matching `db/foe/create.ts` and `db/session/create.ts`, which produce the message `'Valid adventure ID is required'` asserted in the test below.

### `duplicate.ts`

Follows `app/db/session/duplicate.ts` — the single-argument form, since Encounter has no image to duplicate alongside the row. Substitution: `'session'` → `'Encounter'` in `assertValidId` (PascalCase, matching the rest of this domain's guards), `` `Session not found: ${sourceId}` `` → `` `Encounter not found: ${sourceId}` ``, `'sessions'` → `'encounters'`. The session file's inline comment about `active_view` has no counterpart here and is not carried over. Destructure `id`, `name`, `pinned_order`, `created_at`, and `updated_at` out of the source row into `copiedColumns`, and pass `{}` as the `overrides` argument.

### `app/db/_migrations/{timestamp}_add_encounters.ts`

File name timestamp is `Date.now()` evaluated at file-creation time; it must be numerically greater than `1786002768594`, the current highest migration id. The exported const is `addEncountersMigration` with `id` equal to that same timestamp as a string, matching every existing migration's shape.

`up` performs three writes in this order:

1. `await db.execute(encounterTable.createTableSQL);` — importing `encounterTable` from `'../encounter/schema'`, the same pattern `1779321600000_initial_schema.ts` uses for all eleven existing tables.
2. Three `CREATE TRIGGER IF NOT EXISTS` statements for `encounters`, written as literal SQL. Produce them by substituting `encounters` for `tableName` in the template returned by `buildTriggerSQL` in `app/db/_migrations/1784365870026_add_sync_infrastructure.ts` — the `INSERT`, `UPDATE`, and `DELETE` forms, yielding trigger names `trg_sync_encounters_insert`, `trg_sync_encounters_update`, and `trg_sync_encounters_delete`. Do not import or re-export that helper; see the root spec's frozen-copy decision for why the duplication is intentional here.
3. The `table_config` row insert. Use the `INSERT OR IGNORE INTO table_config (...)` statement from `app/db/_migrations/1780099200000_seed_table_config.ts`'s `up` — the same `generateId()` / `generateDbTimestamps()` / `JSON.stringify(layout)` preparation, for this one config rather than a loop over an array:

```ts
const encountersConfig = {
  table_name: 'encounters',
  color: '248, 255, 255',
  tagging_enabled: 1,
  scope: 'adventure',
  layout: {
    searchable_columns: ['name', 'description'],
    columns: [
      { key: 'name', label: 'Name', width: 250 },
      { key: 'created_at', label: 'Created At', width: 250 },
      { key: 'updated_at', label: 'Last updated', width: 250 },
    ],
    sort_state: { column: 'updated_at', direction: 'desc' },
  },
};
```

`searchable_columns` omits `summary` because the column does not exist. `columns` omits the `image_id` avatar entry for the same reason. `tagging_enabled: 1` is what makes encounters reachable from the `@`-mention typeahead: `services/mentionSearchService.ts`'s `searchMentions` filters `tableConfigs` on `tagging_enabled === 1` and searches each matching table by name.

### `app/db/_migrations/index.ts`

Add `import { addEncountersMigration } from './{timestamp}_add_encounters';` alongside the existing imports and append `addEncountersMigration` as the last element of the `migrations` array. It must be last: `migrationHead` is read as `migrations[migrations.length - 1].id` and must remain the highest id.

### `app/db/_sync/registry.ts`

Add `import { encounterTable } from '../encounter/schema';` and insert `{ name: 'encounters', columns: Object.keys(encounterTable.zodSchema.shape) },` into `SYNCED_TABLES` directly after the `items` entry — inside the adventure-scoped block, before `session_steps`. The file's leading comment documents the ordering contract (parents before children); `encounters` is adventure-scoped with no child tables, so any position after `adventures` and within that block satisfies it, and the position after `items` keeps the block contiguous.

### `app/db/_sync/__tests__/registry.test.ts`

Three edits:

- Add `'encounters'` to the `ADVENTURE_SCOPED_TABLES` array, so the "orders adventures before every adventure-scoped table" test covers the new table.
- Change the test title `'should include all 11 synced tables with unique names'` to `'should include all 12 synced tables with unique names'`.
- Change both literals in that test's body from `11` to `12`: `expect(SYNCED_TABLE_NAMES).toHaveLength(12);` and `expect(new Set(SYNCED_TABLE_NAMES).size).toBe(12);`.

## Tests

Six new files in `app/db/encounter/__tests__/`, each mirroring its counterpart in `app/db/foe/__tests__/` — same module-scope `vi.mock('@tauri-apps/plugin-sql', ...)` setup, same `mockSelect.mockResolvedValue([])` in `beforeEach`, same `vi.resetModules()` in `afterEach`. Apply the SF1 substitution table above throughout, plus these deltas.

**Fixture shape.** Every `Encounter` fixture object must declare `description` explicitly (`description: null` where the foe fixtures simply omit it). The `.nullable()` columns are required keys of the derived type, unlike foe's grandfathered `.optional()` columns, so an omitted key is a `tsc` error rather than a valid partial fixture. Fixtures carry no `summary` and no `image_id` key.

**`create.test.ts`** — three tests:

- `'should insert encounter and return generated ID'` — asserts `mockExecute` called with `expect.stringContaining('INSERT INTO encounters')` and `expect.arrayContaining(['test-generated-id'])`, and that the return value is `'test-generated-id'`.
- `'should set adventure_id, default name, and ISO timestamps'` — asserts the values array is exactly `['test-generated-id', 'adventure-123', expect.stringMatching(/^New Encounter /), '2024-01-15T10:30:00.000Z', '2024-01-15T10:30:00.000Z']`. Five elements, not six: the foe version's `expect.stringContaining('"type":"root"')` summary-template element has no counterpart.
- `'should throw when adventure_id is empty'` — asserts rejection with `'Valid adventure ID is required'` and that `mockExecute` was not called.

**`get.test.ts`** — four tests, matching foe's: returns the row for a given id asserting `mockSelect` called with `'SELECT * FROM encounters WHERE id = $1'` and `['test-id']`; returns `null` when the result set is empty; throws `'Valid Encounter ID is required'` for an empty-string id; throws the same for a whitespace-only id.

**`get-all.test.ts`** — four tests, matching foe's: returns rows asserting `mockSelect` called with `'SELECT * FROM encounters WHERE adventure_id = $1 ORDER BY created_at DESC'` and `['adv-1']`; returns `[]` when no rows exist; throws `'Valid Adventure ID is required'` for an empty-string adventure id; throws the same for a whitespace-only adventure id.

**`update.test.ts`** — five tests, matching foe's, with the multi-field test rewritten because `summary` does not exist: single-field update asserts `'UPDATE encounters SET name = $1, updated_at = $2 WHERE id = $3'` with `['Updated Encounter', '2024-01-15T10:30:00.000Z', 'test-id']`; multi-field update passes `{ name: 'New Name', description: 'New description' }` and asserts `'UPDATE encounters SET name = $1, description = $2, updated_at = $3 WHERE id = $4'` with `['New Name', 'New description', '2024-01-15T10:30:00.000Z', 'test-id']`; empty id throws `'Valid Encounter ID is required'`; whitespace-only id throws the same; empty update object throws `'At least one field must be provided for update'`. The last three each also assert `mockExecute` was not called.

**`remove.test.ts`** — three tests, matching foe's: deletes asserting `'DELETE FROM encounters WHERE id = $1'` with `['test-id']`; empty id throws `'Valid Encounter ID is required'`; whitespace-only id throws the same. The two throw tests also assert `mockExecute` was not called.

**`duplicate.test.ts`** — mirrors `app/db/foe/__tests__/duplicate.test.ts`'s setup, including the `vi.mock('../get', ...)` block and the `generateId` mock (returning `'new-encounter-id'`). The source fixture is `{ id: 'source-encounter-id', adventure_id: 'adventure-123', name: 'Goblin Ambush', description: 'Three goblins behind the rocks', pinned_order: 3, created_at: '2023-05-01T08:00:00.000Z', updated_at: '2023-05-02T08:00:00.000Z' }` and the expected statement is:

```ts
const INSERT_SQL =
  'INSERT INTO encounters (id, adventure_id, description, created_at, updated_at) VALUES ($1, $2, $3, $4, $5)';
```

Five tests — the foe file's two image-id tests have no counterpart, since `duplicate` takes no image argument:

- `'omits name so the duplicate has no name'` — asserts `mockExecute` called with `INSERT_SQL` and `expect.any(Array)`, and not called with a statement matching `/^INSERT INTO encounters \([^)]*\bname\b/`.
- `'copies every other source column'` — asserts the values array is exactly `['new-encounter-id', 'adventure-123', 'Three goblins behind the rocks', '2024-01-15T10:30:00.000Z', '2024-01-15T10:30:00.000Z']`.
- `'generates a fresh id and fresh timestamps'` — asserts the return value is `'new-encounter-id'` and the same values array as above.
- `'throws when the source row does not exist'` — with `mockGet.mockResolvedValue(null)`, asserts `duplicate('missing-encounter-id')` rejects with `'Encounter not found: missing-encounter-id'`.
- `'omits pinned_order so the duplicate starts unpinned'` — asserts `mockExecute` not called with a statement matching `/^INSERT INTO encounters \([^)]*\bpinned_order\b/`.

## `domain-scaffold.md` corrections in this sub-feature

Apply these edits to `app/docs/_product/domain-scaffold.md` as part of SF1:

- **Base Schema table** — the Zod column for `name`, `summary`, and `description` reads `z.string().optional()`. Change to `z.string().nullable()`, and add a note that `app/db/CLAUDE.md`'s ban on `.optional()` in `zodSchema` applies unconditionally to new columns, so the existing domain schemas are grandfathered references that must not be copied on this point.
- **Seed Config section** — the entire section instructs the implementer to modify `db/table-config/seed.ts`, which does not exist. Replace it with the migration-based instruction: the new domain's `table_config` row is inserted by the same migration that creates the table, following `db/_migrations/1780099200000_seed_table_config.ts`'s `INSERT OR IGNORE INTO table_config` statement. Remove the `TypedCreateTableConfigInput` code block.
- **`db/migrations/` bullet under DB Layer Patterns** — the directory is `db/_migrations/` (underscore-prefixed), and the migration does three things, not one: create the table, create the three `_sync_changes` triggers for it (frozen literal SQL substituted from `1784365870026_add_sync_infrastructure.ts`'s `buildTriggerSQL`), and insert the `table_config` row.
- **New section: Sync Registration** — `db/_sync/registry.ts` needs a `{ name: '[plural]', columns: Object.keys([singular]Table.zodSchema.shape) }` entry placed inside the adventure-scoped block, and `db/_sync/__tests__/registry.test.ts` asserts an exact synced-table count plus an `ADVENTURE_SCOPED_TABLES` list that both go stale on every new domain.
