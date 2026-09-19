# SF6 — Sync apply

A deletion stops bouncing between two connected devices, and a row deleted on one device no longer comes back when an older update for it arrives later. The sync module's tests move onto the harness, including checks that every synced table has its triggers, that the registry matches the migrated columns, and that tables are applied parents first.

## Files affected

- New: `app/db/_sync/tombstone.ts` — the change-record id and the recorded-tombstone lookup, shared by `applyDelete` and `applyUpsert`.
- Modified: `app/db/_sync/apply-delete.ts` — the no-local-row path skips a deletion already recorded with an equal or later `deleted_at`; `upsertTombstone` builds its id with `changeRecordId`; the comment above the no-local-row path rewritten.
- Modified: `app/db/_sync/apply-upsert.ts` — an upsert older than a recorded tombstone for its row is skipped (every table except `table_config`).
- Modified: `app/services/syncService.ts` — the comment above the null-row skip in `pushBatchesTo` corrected; the `@db/_system` and `@db/_migrations` imports become namespace imports; `applyBatch` reads the own device inside its `try`.
- Modified: `app/db/_sync/__tests__/apply-delete.test.ts`, `apply-upsert.test.ts`, `get-changes-since.test.ts`, `get-max-seq.test.ts`, `get-row-by-id.test.ts`, `peer-state.test.ts`, `registry.test.ts` — rewritten on the harness.

`app/db/_sync/index.ts` is unchanged: it keeps its explicit named exports, and `tombstone.ts` stays internal to `_sync/` because only `apply-delete.ts` and `apply-upsert.ts` use it.

## Database

### `app/db/_sync/tombstone.ts`

A new internal module, named like `peer-state.ts` (an `_sync/` file holding the few functions of one concern). It exports exactly:

- `changeRecordId(tableName: string, rowId: string): string` — returns `` `${tableName}:${rowId}` ``, the id every `_sync_changes` row has. The sync triggers build the same id in SQL (`'<table>:' || NEW.id`, 1784365870026_add_sync_infrastructure.ts:18-43); a comment says so, since SQL cannot import it.
- `getTombstoneDeletedAt(db: Database, tableName: string, rowId: string): Promise<string | null>` — runs `SELECT deleted_at FROM _sync_changes WHERE id = $1 AND deleted = 1` with `changeRecordId(tableName, rowId)` and returns the row's `deleted_at`, or `null` when the row has no recorded tombstone.

`Database` is the type import from `@tauri-apps/plugin-sql`, as in `apply-delete.ts:1`.

### `app/db/_sync/apply-delete.ts`

Per the root KAD "A deletion is applied once". `upsertTombstone` (:6-25) builds its id with `changeRecordId(tableName, rowId)` instead of the inline template (:23). The local-row path (:42-50) is otherwise unchanged. The no-local-row path (:52-54) becomes: `const recordedDeletedAt = await getTombstoneDeletedAt(db, tableName, rowId);` — when it is not `null` and `recordedDeletedAt >= deletedAt` (a string comparison of ISO timestamps, as the file already makes at :44), return `'skipped'`, writing nothing and leaving the counter; otherwise call `upsertTombstone(db, tableName, rowId, deletedAt, true)` and return `'applied'`, as today.

Rewrite the comment above that path: with no local row no trigger fires, so the tombstone is recorded directly — which lets `applyUpsert` refuse an older late update of every table except `table_config`, and relays the deletion onward — unless an equal or later tombstone is already recorded, because re-recording a known deletion would give it a new seq and the two devices would send it back and forth indefinitely.

### `app/db/_sync/apply-upsert.ts`

Per the root KAD "An update older than a recorded deletion is skipped". In `applyUpsert`, after the `table_config` branch (:113-115) and directly before `const localRows = …` (:117), add:

```ts
const recordedDeletedAt = await getTombstoneDeletedAt(db, tableName, id);
if (recordedDeletedAt !== null && recordedDeletedAt > updatedAt) {
  return 'skipped';
}
```

with a comment stating the rule: a deletion recorded later than the incoming row wins, a newer update brings the row back, and an equal timestamp keeps the row, mirroring `applyDelete`'s tie rule; `table_config` merges by `table_name` in the branch above and is not affected. No other branch changes.

### Test files

All seven files use the root KAD's harness wiring and clock control, except `registry.test.ts`, which needs no `vi.mock` (see its table). Tombstones a test depends on are recorded with `applyDelete(table, id, <fixed ISO literal>)`, never with a module's `remove`, whose trigger stamps SQLite's own clock; the incoming rows around it use fixed timestamps a year before, equal to and a year after that literal.

#### `app/db/_sync/__tests__/apply-delete.test.ts`

| Test | Defect it catches |
| --- | --- |
| with a local row older than `deletedAt`, the row is gone and `<table>:<id>` is a tombstone whose `deleted_at` is the incoming `deletedAt`, not this device's clock | the local delete time replacing the origin's, so the two devices disagree about when the row was deleted |
| with a local row whose `updated_at` equals or is later than `deletedAt`, it returns `'skipped'` and the row remains (two cases) | an older deletion destroying a newer edit |
| with no local row and no change record, it returns `'applied'` and records a tombstone with `deletedAt` and a seq above the previous maximum | a deletion that never relays to a third device |
| re-applying a deletion that is already recorded with the same `deleted_at`, and one with an earlier `deleted_at`, returns `'skipped'` and leaves `_sync_meta`'s seq and the tombstone unchanged | the endless bounce: every re-application minting a new seq that is sent back |
| a deletion later than the recorded tombstone updates its `deleted_at` and gives it a new seq | a stale deletion time kept, letting late updates between the two deletion times resurrect the row |
| a table missing from the sync registry returns `'skipped'` and writes nothing | a peer-supplied table name reaching an interpolated DELETE |

#### `app/db/_sync/__tests__/apply-upsert.test.ts`

Rows for "new row" cases are built by creating a row with the real module function, reading it with `getRowById`, and giving the copy a new `id` and a later `updated_at`, so the row has exactly the shape a peer sends. `table_config` rows start from the seeded `'npcs'` config read with `getRowById`, because `tableConfig.create` cannot add a second `'npcs'` row past the unique index on `table_name`.

| Test | Defect it catches |
| --- | --- |
| an adventure row with `description` and `image_id` `null`, a session row with `name`, `description`, `summary` and `session_date` `null`, and a session step row with `name`, `content` and `default_step_key` `null` are each applied and stored with those `null`s | nullable text columns rejected by validation, so new rows never reach the other device |
| a row whose `id` is missing, whose `id` is `''`, or whose `updated_at` is `''` returns `'skipped'` and writes nothing (three cases) | an untrusted row with an empty key or timestamp written |
| with a local row newer than the incoming one, it returns `'skipped'` and keeps the local values | an older update overwriting a newer local edit |
| with equal `updated_at`, `force: false` returns `'skipped'` and `force: true` applies the incoming values | the tie-break reversed, so the two devices end up with different rows |
| with a local row older than the incoming one, the incoming values are stored | a newer peer edit ignored |
| an incoming row a year older than the recorded tombstone returns `'skipped'` and the row stays absent | a deleted row resurrected by a late, older update |
| an incoming row a year newer than the tombstone is stored and its change record is live again (`deleted` 0) | a newer edit blocked forever by an earlier deletion |
| an incoming row with the tombstone's exact timestamp is stored | the tie going to the deletion, against the rule that a tie keeps the row |
| after an incoming `'npcs'` config with a different id and `updated_at` `2030-01-01T00:00:00.000Z` replaces the seeded one, and `applyDelete('table_config', <seeded id>, '2050-01-01T00:00:00.000Z')` records that id's tombstone, an update for the seeded id with `updated_at` `2040-01-01T00:00:00.000Z` returns `'applied'` and leaves the seeded id as the only `'npcs'` row, with the update's values | the tombstone check reaching `table_config`, keeping an older config over a newer update |
| a row with an extra key the registry does not list is applied with that key ignored, and a row with a wrong-typed column is skipped | peer keys reaching the column list of the INSERT, or malformed rows written |
| a session row whose `adventure_id` has no adventure returns `'skipped'` | a foreign-key failure thrown out of the batch instead of skipping the row |
| an incoming `'npcs'` config with a different id and a later `updated_at` leaves exactly one `'npcs'` row, with the incoming id and values, and a tombstone for the replaced local id | merging `table_config` by id, duplicating every list config on first sync |
| an incoming `'npcs'` config older than the local one is skipped, and a config whose `table_name` is not an entity type is skipped | an older config overwriting a newer one, or an arbitrary config row accepted |
| a table missing from the sync registry returns `'skipped'` | a peer-supplied table name reaching an interpolated INSERT |

A row with no `updated_at` key is not a fourth case: every synced table declares `updated_at` `NOT NULL`, so without the guard the INSERT fails and `executeUpsert`'s catch (apply-upsert.ts:45-51) returns `'skipped'` all the same, and no test can tell whether the guard is there; the type check keeps that branch, because `isLocalNewer` takes a string.

#### `app/db/_sync/__tests__/get-changes-since.test.ts`

| Test | Defect it catches |
| --- | --- |
| after creating four adventures, `getChangesSince(s, 2)` with `s` three below the current maximum seq returns exactly the change rows with seq `s + 1` and `s + 2`, ascending, and not the one at `s + 3` | an inclusive bound re-sending a change, a missing `LIMIT`, or a descending order that moves the push cursor past unsent changes (`pushBatchesTo` takes the last row's seq as the batch maximum) |

#### `app/db/_sync/__tests__/get-max-seq.test.ts`

| Test | Defect it catches |
| --- | --- |
| the value grows by exactly one when one adventure is created | reading a different row or column than the counter the triggers bump |

#### `app/db/_sync/__tests__/get-row-by-id.test.ts`

| Test | Defect it catches |
| --- | --- |
| with two adventures stored, returns the full row of the one whose id is passed, and `null` for an unknown id | a dropped `WHERE id`, the wrong table queried, or `undefined` for a missing row |
| a table missing from the sync registry throws an error starting `Unknown synced table` | a peer-supplied table name reaching an interpolated SELECT |

#### `app/db/_sync/__tests__/peer-state.test.ts`

Peer ids are 64 lowercase hex characters.

| Test | Defect it catches |
| --- | --- |
| an unknown peer's watermark is 0; after `setPeerWatermark(peer, 5)` it is 5, and after `setPeerWatermark(peer, 9)` it is 9 | an upsert that does not update, freezing the watermark at its first value |
| after `removePeerState(peer)` the watermark is 0 again | forgotten peers keeping a watermark, so a re-pair skips changes |
| each of the three functions rejects a non-hex id and writes nothing | a malformed peer id reaching SQL |

#### `app/db/_sync/__tests__/registry.test.ts`

`// @vitest-environment node`, no `vi.mock`, a departure from the root KAD "Test-file wiring under Vitest 5" that it names: each test opens a database with `openTestDatabase()` and runs `runMigrations(db)` from `@db/_migrations` on it directly, then reads `sqlite_master` and `PRAGMA` results. The current file's tests are all replaced: its column-list test compares `columns` with the zod keys they are derived from (registry.ts:22), its table-count test pins the array's current length, its four order tests check six hand-picked parent/child pairs (registry.test.ts:7-32), and its "should include id and updated_at in every table entry" test (:39-44) becomes the last row below, which keeps its check.

| Test | Defect it catches |
| --- | --- |
| every table in `SYNCED_TABLE_NAMES` has an insert, an update and a delete `trg_sync_*` trigger, and every `trg_sync_*` trigger belongs to a table in `SYNCED_TABLE_NAMES` | a synced table without triggers (its changes never recorded), or a change record for an unregistered table (making `getRowById` throw during a push) |
| each synced table's registry `columns` equal the column names `PRAGMA table_info` reports for the migrated table | drift between a zod schema and the migration that creates its table: a column never synced, or an INSERT naming a column that does not exist |
| each synced table comes after every synced table it references through `PRAGMA foreign_key_list` | a child applied before its parent within a batch, every child insert failing its foreign key |
| every synced table's registry `columns` include `id` and `updated_at` | a synced table without the key or the timestamp `applyUpsert` requires, so every peer skips its rows — which the `PRAGMA` equality above does not catch when the migration lacks the column too |

## Services

### `app/services/syncService.ts`

- Rewrite the comment directly above `const row = await syncDb.getRowById(change.table_name, change.row_id);` in `pushBatchesTo` (syncService.ts:123) to: a `null` row means the row was deleted after this change was read; its own delete trigger — cascade deletes included — has already rewritten the change as a tombstone with a later seq, which a later batch sends, so this change is skipped. The code is unchanged.
- Active check on the touched file: `app/services/CLAUDE.md` requires the DB layer to be imported through namespace imports (`import * as sessionDb from '@db/session'`, services/CLAUDE.md:9), and syncService.ts imports `{ getDevice }` from `@db/_system` (:2) and `{ migrationHead }` from `@db/_migrations` (:4) by name. Replace them with `import * as systemDb from '@db/_system';` and `import * as migrationsDb from '@db/_migrations';`, and update the uses: `getDevice()` at :158 becomes `systemDb.getDevice()`, and `migrationHead` at :50, :75 and :90 becomes `migrationsDb.migrationHead`. The comment at :311 names `migrationHead` as a concept and stays.
- Active check, second finding: `app/services/CLAUDE.md` (:12-13) requires every exported function to wrap its DB calls and throw a typed domain error, but `applyBatch` reads the own device (:158-160) before its `try` (:175), so a database or schema error from `getDevice()` reaches `handleSyncMessage`'s caller (app/src/data-access-layer/devices/useConnectivityLifecycle.ts:139) unwrapped. Move the `ownDevice` line, the comment above `force` and the `force` line to the top of the `try` block, so `syncApplyError` wraps them; grouping the changes by table stays before the `try`, since it reads no database.

[DEFERRED-VIOLATION: `app/services/CLAUDE.md`:9, DB layer through namespace imports — `app/services/devicesService.ts`:4 imports `{ getDevice, updateDevice, type DeviceData }` from `@db/_system` by name] `devicesService.ts` is not touched by this spec, so the active-check rule does not reach it; converting it would add a file whose only change is unrelated to test hardening.
