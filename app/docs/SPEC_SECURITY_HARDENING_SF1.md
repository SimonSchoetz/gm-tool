# SF1 — Mention-search injection guard

A peer that has been paired with this device can push rows for any synced table, including `table_config`. Nothing validates the `table_name` column on an incoming `table_config` row, and `searchMentions` passes that column value into a SQL string that interpolates it as a table name. Because the SQLite driver executes multiple `;`-separated statements from a single query string, a crafted `table_name` executes arbitrary SQL the next time any user types `@` into any text editor in the app. This sub-feature closes the path at the interpolation site and stops the poisoned row from landing in the first place.

## Files affected

`Modified:`

- `app/db/mention-search.ts` — add an entity-type guard to `searchByName` and to `getById`; rewrite both interpolation comments to describe the guarantee the file now has
- `app/db/_sync/apply-upsert.ts` — replace the empty-string check on the incoming `table_name` in `applyTableConfigUpsert` with a `SYNCED_TABLE_NAMES` membership check
- `app/services/mentionSearchService.ts` — extend the enabled-config filter with an entity-type check, commented as an early-out rather than a boundary
- `app/db/__tests__/mention-search.test.ts` — the existing test `should search without adventureId filter when adventureId is null` calls `searchByName('places', 'tav', null)` and asserts the SQL string `FROM places`; `places` is not an entity type, so both the call argument and the expected SQL string go stale and must change. Two rejection tests are added.
- `app/db/_sync/__tests__/apply-upsert.test.ts` — add one rejection test for a `table_config` row naming a non-synced table

No barrel changes. `app/domain/entities/index.ts` already exports `isEntityType` by name and uses explicit named exports throughout, satisfying the barrel rule in `app/CLAUDE.md` — Directory Structure; this sub-feature adds no export to `app/db/` and removes none.

## DB changes

### `app/db/mention-search.ts`

Add the import `import { isEntityType } from '@domain/entities';` above the existing `import { getDatabase } from './database';`. The `db/` to `@domain` import edge is already established — `app/db/_sync/peer-state.ts` and `app/db/paired-device/schema.ts` both import from `@domain`, and `app/domain/CLAUDE.md` — Imports sanctions the `@domain/<subdomain>` form used here.

In `searchByName`, before `const db = await getDatabase();`, add a guard returning `[]`. In `getById`, in the same position, add a guard returning `null`. Both return the function's own empty result rather than throwing: `searchByName` runs on every keystroke behind the mention typeahead, and a throw there would surface an error boundary for what is a data-integrity condition, not a user-facing failure.

Replace the comment currently on the line above the `adventureId !== null` branch in `searchByName` with:

```ts
// tableName is interpolated directly because SQL does not support parameterized table names. The isEntityType guard above is what makes that safe — table_config.table_name is writable by any paired peer over sync, so no caller can be assumed to have validated it.
```

Replace the comment currently above the `db.select` call in `getById` with:

```ts
// tableName is interpolated directly because SQL does not support parameterized table names. The isEntityType guard above is what makes that safe — callers are not assumed to have validated it.
```

Both replacement comments are single unwrapped lines. The existing `getById` comment names `services/mentionSearchService.ts`'s `getMentionEntityData` as the validating caller; that delegation is what this change removes, so the sentence naming it must go rather than being kept alongside the new guard.

### `app/db/_sync/apply-upsert.ts`

Change the registry import to bring in both names: `import { SYNCED_TABLES, SYNCED_TABLE_NAMES } from './registry';`.

In `applyTableConfigUpsert`, replace the two lines

```ts
const tableName = filtered.table_name;
if (typeof tableName !== 'string' || tableName === '') return 'skipped';
```

with

```ts
const tableName = filtered.table_name;
if (typeof tableName !== 'string' || !SYNCED_TABLE_NAMES.includes(tableName))
  return 'skipped';
```

The `tableName === ''` check is dropped rather than kept alongside the new one: `SYNCED_TABLE_NAMES.includes('')` is already `false`, so retaining it would be a compile-time-provable redundant condition. `tableName` is declared `const`, so TypeScript's narrowing from the `typeof` operand carries into the second operand and into every later use in the function.

The guard must sit above the `SELECT id, updated_at FROM table_config WHERE table_name = $1` query, so a rejected row issues no database call at all.

## Services

### `app/services/mentionSearchService.ts`

`isEntityType` is already imported in this file from `@domain/entities`. Change the filter line

```ts
const enabledConfigs = tableConfigs.filter((c) => c.tagging_enabled === 1);
```

to

```ts
// Not the security boundary — searchByName validates its own tableName. This filter only avoids issuing a query per non-entity config on every keystroke.
const enabledConfigs = tableConfigs.filter(
  (c) => c.tagging_enabled === 1 && isEntityType(c.table_name),
);
```

Leave the rest of `searchMentions` unchanged, including the `getMentionEntityData` guard further down the file — that guard now duplicates one inside `getById`, but it also short-circuits before the `try` block and returns the `{ name: null, deleted: true }` shape the caller expects for an unknown entity type, which is behavior the DB-layer guard does not provide.

## Data Access Layer

No change.

## Frontend

No change. `app/src/components/TextEditor/plugins/MentionTypeaheadPlugin/MentionTypeaheadPlugin.tsx` calls `searchMentions` and consumes its result array; a shorter array is already a valid result and needs no handling change.

## Tests

### `app/db/__tests__/mention-search.test.ts`

The file mocks `@tauri-apps/plugin-sql` at module scope with a static top-level import of the functions under test and `vi.resetModules()` in `afterEach`. That is the correct pattern for this file per `app/db/CLAUDE.md` — Testing, since every assertion targets `mockSelect` call history rather than `getDatabase`'s own caching behavior. Keep the scaffolding as it is.

In the `searchByName` describe block:

- In `should search without adventureId filter when adventureId is null`, change the call to `await searchByName('adventures', 'tav', null)` and the first `expect(mockSelect).toHaveBeenCalledWith` argument to the string `` `SELECT id, name, updated_at FROM adventures WHERE name LIKE $1 ORDER BY updated_at DESC` ``. Leave the second argument `['%tav%']` and the returned-row fixture unchanged. `adventures` is chosen because it is a member of `ENTITY_TYPES` whose seeded `table_config` row carries `scope: 'global'`, which is the configuration that produces a null `adventureId` at the call site this test represents.
- Add `should return an empty array for a non-entity table name without querying`: call `await searchByName('table_config', 'x', 'adv-1')`, assert the result `toEqual([])`, and assert `expect(mockSelect).not.toHaveBeenCalled()`.

In the `getById` describe block:

- Add `should return null for a non-entity table name without querying`: call `await getById('table_config', '1')`, assert the result `toBeNull()`, and assert `expect(mockSelect).not.toHaveBeenCalled()`.

### `app/db/_sync/__tests__/apply-upsert.test.ts`

Add one test after the existing `should match table_config by table_name and delete the differently-id'd loser`:

`should skip a table_config row whose table_name is not a synced table` — call `applyUpsert` with `'table_config'` and a row identical in shape to the one in the existing `table_config` test except `table_name: 'npcs; DROP TABLE adventures'`, and `force` of `false`. Assert the result is `'skipped'`, `expect(mockSelect).not.toHaveBeenCalled()`, and `expect(mockExecute).not.toHaveBeenCalled()`. Both mock assertions are meaningful here because the guard sits above the `table_config` lookup select, which is the first database call the function would otherwise make.

The file's `beforeAll` already warms the `getDatabase()` singleton and its `beforeEach` already sets `mockSelect.mockResolvedValue([])`, as `app/db/CLAUDE.md` — Testing requires of any file reaching `getDatabase()`. Add no new scaffolding.
