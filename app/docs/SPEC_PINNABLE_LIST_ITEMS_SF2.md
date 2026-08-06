# SF2 — Persisted pin state

Add the `pinned_order` column across the seven entity tables and the full stack that reads and writes it: a cross-table DB utility, a domain error, a service, and a DAL mutation hook. No UI in this sub-feature.

The seven tables throughout this sub-feature are `npcs`, `pcs`, `foes`, `factions`, `locations`, `items`, and `sessions` — the tables behind the seven screens that render `SortableList`. `adventures` is not among them: that screen is a card grid, not a list.

## Files affected

**New:**

- `app/db/_migrations/<timestamp>_add_pinned_order.ts`
- `app/db/pinned-order.ts`
- `app/domain/pinned-order/errors.ts`
- `app/domain/pinned-order/index.ts`
- `app/services/pinnedOrderService.ts`
- `app/src/data-access-layer/pinned-order/useSetPinnedOrder.ts`
- `app/src/data-access-layer/pinned-order/index.ts`

**Modified:**

- `app/db/_migrations/index.ts` — import the new migration and append it to the `migrations` array, last in ascending timestamp order.
- `app/db/{npc,pc,foe,faction,location,item,session}/schema.ts` — add the `pinned_order` column (7 files).
- `app/db/{npc,pc,foe,faction,location,item,session}/duplicate.ts` — exclude `pinned_order` from the copied columns (7 files).
- `app/db/{npc,pc,foe,faction,location,item,session}/__tests__/duplicate.test.ts` — add a `pinned_order` value to the source-row fixture and one new assertion per file (7 files); detail below.
- `app/domain/index.ts` — add the new subdomain.
- `app/src/data-access-layer/index.ts` — add the new hook export.
- `app/docs/_product/domain-scaffold.md` — add `pinned_order` to the Base Schema table, and add it to the Duplication section's list of columns a `duplicate.ts` must exclude.

**No change needed (verified):**

- `app/db/_sync/registry.ts` — `SYNCED_TABLES` derives each entry's column list from `Object.keys(<table>.zodSchema.shape)`, so the new column joins the synced set as soon as it is added to each `schema.ts`. No registry edit exists to make.
- `app/db/{npc,pc,foe,faction,location,item,session}/get-all.ts` — all seven issue `SELECT * FROM <table> WHERE adventure_id = $1`, so the new column is returned with no query change [spec-writer_15: `grep "SELECT .* FROM" db/{npc,pc,foe,faction,location,item,session}/get-all.ts` — all seven use `SELECT *`].
- `app/db/{npc,pc,foe,faction,location,item,session}/types.ts` — entity types are derived via `z.infer` from `zodSchema`, so the field appears automatically once the schema column is added.

## DB

### Migration — `app/db/_migrations/<timestamp>_add_pinned_order.ts`

File name timestamp is `Date.now()` at file creation, must exceed `1784896762609` (the current highest), and must equal the exported object's `id`. Follow the shape of `app/db/_migrations/1782657640641_add_settings_table.ts`: a module-local `const up = async (db: Database): Promise<void> => {...}` and a named export `{ id, up }`.

`up` issues one `ALTER TABLE <table> ADD COLUMN pinned_order INTEGER` per table, for all seven. No `NOT NULL`, no `DEFAULT` — the absence of a value is the unpinned state, and every existing row correctly becomes unpinned by receiving SQL `NULL`. The `_migrations` ledger guarantees the migration body executes exactly once, which is what makes bare `ADD COLUMN` safe here; no temp tables are involved, so the `DROP TABLE IF EXISTS` guidance in `app/db/CLAUDE.md` does not apply.

Register it in `app/db/_migrations/index.ts` by adding the import and appending the exported const to the `migrations` array.

### Schema — the seven `schema.ts` files

Add one column entry to each `columns` object:

```ts
pinned_order: {
  type: 'INTEGER',
  zod: z.number().nullable(),
},
```

No `notNull`, no `default`, and no `.optional()`. `app/db/CLAUDE.md` is explicit that a nullable column uses `.nullable()` alone on `zodSchema`: a `SELECT *` row always has the key present, and its absent value is SQL `NULL` mapped to JS `null`, never `undefined`. The grandfathered `.optional()` fields already present in these files are pre-existing debt and must not be converted as a side effect of this edit — that same section of `app/db/CLAUDE.md` explicitly exempts them from the fix-violations-in-files-you-touch rule.

`generateUpdateSchema` wraps every non-primary-key, non-timestamp field as optional, so `pinned_order` becomes part of each domain's update input type automatically. That is harmless and expected; this feature does not route writes through the per-domain `update.ts`.

### `app/db/pinned-order.ts`

A cross-table flat file at the db root, alongside `mention-search.ts`, per `app/db/CLAUDE.md` — Cross-table utilities. It exports two functions.

`getMaxPinnedOrder(tableName: string, entityId: string): Promise<number | null>` — selects `MAX(pinned_order)` from the table where `pinned_order IS NOT NULL` and `adventure_id` equals the adventure of the row identified by `entityId`, obtained through a correlated subquery against the same table rather than a caller-supplied argument. Returns the value, or `null` when no row in that adventure is pinned.

The `adventure_id` predicate is required, because ordinals are per adventure: a pin in one adventure must not push the next pin in another adventure to a higher number. Deriving it in SQL rather than accepting it as a parameter is what keeps `adventureId` out of the service, the hook, and the component — the row already knows which adventure it belongs to, so no caller needs to supply it, and `RowActionsMenu` needs no route-params lookup and no undefined-adventure branch.

`setPinnedOrder(tableName: string, id: string, pinnedOrder: number | null): Promise<void>` — updates `pinned_order` on the row with the given id. Passing `null` is the unpin path; it is a real value to write, not an omission.

Both interpolate `tableName` directly into the SQL string because SQL cannot parameterize table names, and both carry the same safety comment `mention-search.ts` carries at each interpolation site: stating that the value must only ever arrive from the canonical entity type list, validated at the service layer, never from user input. Every other value is a bound parameter.

`assertValidId(id, ...)` from `../util` is not applicable here — the label argument is per-domain and this file is domain-agnostic. Validation of the entity id belongs to the service layer, which knows the entity type.

## Domain

### `app/domain/pinned-order/errors.ts`

One error type and factory, following `app/domain/mentions/errors.ts` exactly. Substitution:

| `mentions/errors.ts` | `pinned-order/errors.ts` |
| --- | --- |
| `MentionSearchError` | `PinnedOrderError` |
| `mentionSearchError` | `pinnedOrderError` |
| `` `Failed to search mentions: ${String(cause)}` `` | `` `Failed to update pinned order: ${String(cause)}` `` |

Factory function, never a class — `app/CLAUDE.md` — Error types.

### `app/domain/pinned-order/index.ts`

Explicit named exports, matching `app/domain/mentions/index.ts`:

```ts
export type { PinnedOrderError } from './errors';
export { pinnedOrderError } from './errors';
```

### `app/domain/index.ts`

Add `export * from './pinned-order';` in alphabetical position, between `'./pcs'` and `'./session-steps'`. `export *` is correct here and is not a violation: `app/CLAUDE.md` — Directory Structure carves out grouping barrels whose layer documents a dual-path import convention, which `domain/CLAUDE.md` — Imports does, and every existing entry in this barrel uses that form.

## Services

### `app/services/pinnedOrderService.ts`

Two exported functions. Both validate the entity type first, then wrap the DB call in try/catch and rethrow via `pinnedOrderError` — the same shape `getMentionEntityData` uses in `app/services/mentionSearchService.ts`.

`pinEntity(entityType: string, entityId: string): Promise<void>` — validates via `isEntityType` from `@domain/entities`, reads the current maximum through `getMaxPinnedOrder`, and writes `(max ?? -1) + 1`. The `-1` seed makes the first pin in an empty section land on `0`.

`unpinEntity(entityType: string, entityId: string): Promise<void>` — validates the entity type, then writes `null`.

Both throw `pinnedOrderError` when `isEntityType` rejects the value. This differs deliberately from `getMentionEntityData`, which returns a "deleted" result for an unknown type because an unresolvable mention is an expected state there. Here an unknown entity type can only mean a programming error, and there is no sensible value to return from a `void` operation.

Import the DB functions as a namespace — `import * as pinnedOrder from '@db/pinned-order';` — matching the `import * as mentionSearch from '@db/mention-search';` form and `app/db/CLAUDE.md` — Naming.

## Data Access Layer

### `app/src/data-access-layer/pinned-order/useSetPinnedOrder.ts`

```ts
useSetPinnedOrder(entityType: string, entityId: string): UseSetPinnedOrderReturn
```

Both identifiers are known when the hook is constructed — the consuming component renders once per row — so both are captured in the closure. Neither `mutationFn` takes a parameter. `app/src/CLAUDE.md` is explicit that a `mutationFn` accepting an id already available at construction time is always wrong.

There is deliberately no `adventureId` parameter: the ordinal's adventure scoping is resolved in SQL (see `getMaxPinnedOrder` above), and the invalidation below needs only the entity type.

Two `useMutation` calls, one per direction, each calling the matching service function. The return type exposes named wrappers only:

```ts
type UseSetPinnedOrderReturn = {
  pinItem: () => Promise<void>;
  unpinItem: () => Promise<void>;
};
```

Never return `mutateAsync` directly, even though its type would be compatible — the wrapper is the boundary that keeps callers off TanStack Query's dispatch shape.

Both mutations invalidate on success with `{ queryKey: [entityType] }`. This is a deliberate single-element prefix rather than a full list key: query key factories are module-internal and cannot be imported here, and all seven list factories produce `[<plural table name>, adventureId]` where the first element is the `EntityType` value. Detail keys are singular and are intentionally left alone.

No try/catch anywhere in this file. Errors propagate to the Error Boundary.

This hook has no consumer in this sub-feature. It is wired in SF3, where `RowActionsMenu` imports it from `@/data-access-layer` and calls `pinItem` / `unpinItem` from its two menu options.

### `app/src/data-access-layer/pinned-order/index.ts`

Module directory barrel with an explicit named export:

```ts
export { useSetPinnedOrder } from './useSetPinnedOrder';
```

Explicit rather than `export *`, so the `UseSetPinnedOrderReturn` type stays internal.

### `app/src/data-access-layer/index.ts`

Grouping barrel, explicit named exports only. Add `export { useSetPinnedOrder } from './pinned-order';`.

## Duplication fix

In each of the seven `duplicate.ts` files, add `pinned_order` to the destructure that builds `copiedColumns`, following the existing underscore-prefixed alias convention in those files:

```ts
pinned_order: _sourcePinnedOrder,
```

It receives no entry in the `overrides` argument. A column excluded from `copiedColumns` with no override is omitted from the INSERT and takes its SQL default, which for this nullable column is `NULL` — so the duplicate starts unpinned, which is the required behavior.

## Tests

### `app/db/{npc,pc,foe,faction,location,item,session}/__tests__/duplicate.test.ts` — 7 files

Each of these asserts against a hardcoded `INSERT_SQL` string and exact parameter arrays, so the fixture change and the exclusion must land together.

Add `pinned_order` with a non-null number to the mocked source row fixture. Then add one test:

- `'omits pinned_order so the duplicate starts unpinned'` — asserts `mockExecute` was not called with an INSERT naming the `pinned_order` column, mirroring the existing `'omits name so the duplicate has no name'` test's `expect.stringMatching(/^INSERT INTO <table> \([^)]*\bname\b/)` form.

The existing `'copies every other source column'` test must keep passing unchanged: because `pinned_order` is excluded, `INSERT_SQL` and its parameter array are unaffected by the fixture gaining the field. If that test fails after the change, the exclusion was not applied.

### `app/db/__tests__/` — no new file

`pinned-order.ts` is a cross-table utility with two thin query functions. `app/db/CLAUDE.md` — Testing requires a test file for every public function in a *domain directory*; this file is not in one. `mention-search.ts` is the precedent for a root-level cross-table file, and it does have `db/__tests__/mention-search.test.ts`. Follow that precedent: create `app/db/__tests__/pinned-order.test.ts` with one test per function.

- `'getMaxPinnedOrder scopes the maximum to the adventure of the given row'` — asserts the SELECT filters on `pinned_order IS NOT NULL` and derives `adventure_id` through the correlated subquery, with the entity id bound as a parameter.
- `'getMaxPinnedOrder returns null when no row is pinned'` — the empty / null-aggregate result path.
- `'setPinnedOrder writes the given number to the identified row'`
- `'setPinnedOrder writes null when unpinning'` — this is a distinct code path from the one above, not a variation of it: `null` is a written value, and a test that only covers the numeric path would not catch an implementation that treats `null` as "no update".

Scaffolding: `afterEach(() => { vi.resetModules(); })` with a static top-level import of the functions under test, matching `db/adventure/__tests__/`. The stricter pattern — `vi.resetModules()` in `beforeEach` plus a dynamic `await import(...)` inside each test — is not used here, because `app/db/CLAUDE.md` scopes it to suites that assert on `initDatabase`'s or `getDatabase`'s own initialization or caching behavior. This suite asserts only on `mockExecute` / `mockSelect` call history, which `vi.clearAllMocks()` already resets per test, so a surviving module-level `db` cache cannot falsify any assertion here.

Add `mockSelect.mockResolvedValue([])` in `beforeEach` before anything else, per `app/db/CLAUDE.md` — Testing: any test reaching `getDatabase()` runs the migration check and crashes without it.

### Service, DAL — no tests

`app/src/CLAUDE.md` — Testing Policy scopes required tests to helper and util functions. Service and DAL modules are not in that scope, and no existing service or DAL module in this codebase carries tests.
