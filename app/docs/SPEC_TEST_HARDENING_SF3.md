# SF3 — Migration and database-init tests

The two migrations that destroy data — `1789304154994_add_base_entities` drops six tables, `1789743068849_add_base_entity_content_sections` drops a column and rewrites stored layouts — are not in any release yet, and today's tests only check which SQL strings they issue. This SF tests what they do to real data, including that a run interrupted before any statement finishes correctly when the app restarts, and tests the migration runner, the database initializer and the stored-layout parser. No production code changes.

## Files affected

- Modified: `app/db/_migrations/__tests__/1789304154994_add_base_entities.test.ts` — rewritten on the harness.
- Modified: `app/db/_migrations/__tests__/1789743068849_add_base_entity_content_sections.test.ts` — rewritten on the harness.
- Modified: `app/db/_migrations/__tests__/runMigrations.test.ts` — rewritten on the harness.
- Modified: `app/db/__tests__/init-database.test.ts` — rewritten on the harness.
- New: `app/db/table-config/__tests__/parse-layout-row.test.ts`.

## Database

### Shared approach for the two migration tests

Both files start with `// @vitest-environment node` and use no `vi.mock`, a departure from the root KAD "Test-file wiring under Vitest 5" that it names: they never reach `getDatabase()`. They call `openTestDatabase()` and `applyMigrationsBefore(db, '<id>')` from `@db/__tests__/support/sqlite-test-database`, seed rows with `db.execute(...)`, and run the migration under test through its named export — `addBaseEntitiesMigration` from `../1789304154994_add_base_entities` and `addBaseEntityContentSectionsMigration` from `../1789743068849_add_base_entity_content_sections` — calling `up(db)` with the `TestDatabase` directly (SF2). Seeding with SQL is fixture setup; assertions read rows back with `db.select(...)`.

Every seeded id and timestamp is a fixed literal, never taken from `Date` or `generateId`, so two independently seeded databases hold identical data. A tombstone produced by a legacy delete trigger gets its `deleted_at` from SQLite's own clock (`strftime(... 'now')`, 1784365870026_add_sync_infrastructure.ts:28-29), which fake timers cannot reach, so the seed overwrites it right after the `DELETE`: `UPDATE _sync_changes SET deleted_at = '<fixed ISO literal>' WHERE id = 'npcs:<id>'` [spec-writer_38: ran the resume sweep with the trigger's own `deleted_at` — observed all 34 cases differing only in that value; with it pinned, none differed].

A `snapshot(db: TestDatabase)` helper in each file returns, each read with an `ORDER BY` on its key: every row of `base_entities`; for the second migration also every row of `base_entity_content_sections` and the `table_name` and `layout` (only those two columns) of the six base-entity `table_config` rows; every `_sync_changes` row whose `table_name` is not `table_config`; `_sync_meta`'s `seq`; and the `name`s in `sqlite_master`. Snapshots are compared with `toEqual`. `table_config` ids, timestamps and change rows are excluded because the seed migration gives each fresh database random `table_config` ids and wall-clock timestamps, and the backfill migration's seq order follows those ids [spec-writer_39: app/db/_migrations/1780099200000_seed_table_config.ts:172-173; app/db/_migrations/1784896762609_backfill_sync_changes.ts:19-23; ran the resume sweep without the exclusion — observed differences only in `table_config` rows].

The resume tests: count the calls a clean `up` makes (`callCount()` after `up` minus before). For every `k` from 1 to that count, seed a fresh database the same way, call `db.failOnCall(<callCount() before up> + k)`, await `up(db)` rejecting with `Injected failure`, run `up(db)` again, and compare its snapshot with the clean run's. Both migrations resume cleanly from every statement today [spec-writer_40: ran this sweep on scratch copies with the fixed literals — observed the resumed snapshot equal to the clean one for all 34 statements of 1789304154994 and all 13 of 1789743068849].

### `app/db/_migrations/__tests__/1789304154994_add_base_entities.test.ts`

Seed after `applyMigrationsBefore(db, '1789304154994')`: one adventure and one image; one row in each of the six legacy tables (`npcs`, `pcs`, `foes`, `factions`, `locations`, `items`) with `name`, `summary`, `description`, `image_id` (the seeded image), `pinned_order` and both timestamps set to distinct values; and one legacy tombstone, produced by inserting and then deleting an extra `npcs` row so the legacy delete trigger writes it, with its `deleted_at` pinned as above.

| Test | Defect it catches |
| --- | --- |
| every legacy row arrives in `base_entities` with `entity_type` equal to its table's name and `adventure_id`, `name`, `summary`, `description`, `image_id`, `pinned_order`, `created_at`, `updated_at` unchanged | a column copied into the wrong position, dropped, or a wrong `entity_type` |
| the six legacy tables no longer exist, no `_sync_changes` row names a legacy table, and each copied row has a live `base_entities:<id>` change row | legacy tables left behind, or the copy running before the sync triggers so migrated rows never reach a peer |
| the legacy tombstone becomes `base_entities:<id>` with `deleted = 1`, its `deleted_at`, and its original seq | a deletion lost in the migration, so a peer re-sends the deleted row |
| running `up` a second time on the migrated database leaves the snapshot unchanged | a re-run duplicating rows or re-sequencing changes |
| interrupted before any one statement and run again, the migration ends in the clean run's snapshot | a statement that cannot be re-issued after a partial run — for example the tombstone copy placed after its table's `DROP TABLE` and gated on the table still existing, so a restart after the drop loses the tombstone |

The id-collision path is deliberately untested (root KAD "A cross-table id collision in the base-entities migration is not tested").

### `app/db/_migrations/__tests__/1789743068849_add_base_entity_content_sections.test.ts`

Seed after `applyMigrationsBefore(db, '1789743068849')`: one adventure; four base entities with `summary` set to `'An npc summary'`, `NULL`, `''` and a JSON string. The six base-entity `table_config` layouts are the ones the seed migration wrote. Before running `up`, rewrite the `locations` layout with SQL so its `searchable_columns` no longer contains `'summary'`, and record its `_sync_changes` seq.

| Test | Defect it catches |
| --- | --- |
| each entity with a non-null summary — `''` included — gets exactly one section with `id` and `base_entity_id` equal to the entity's id, `name` `'Summary'`, `type` `'text'`, `content` equal to the summary, `sort_order` 0, `checked` 0 and the entity's own timestamps; the entity with a `NULL` summary gets none | a fresh id per device (duplicated summaries after sync), `NULL` copied as a section, or content moved to the wrong column |
| `PRAGMA table_info(base_entities)` no longer lists `summary` | the column drop missing |
| in each of the six base-entity layouts only `'summary'` is gone from `searchable_columns`; every other layout field is unchanged and every `table_config` row keeps its `updated_at` | rewriting more than the searchable list, or bumping `updated_at` so each device's copy competes in sync |
| the `locations` layout, which no longer listed `'summary'`, keeps its `_sync_changes` seq | rewriting every layout unconditionally, re-sending unchanged configs to peers |
| running `up` a second time leaves the snapshot unchanged | a re-run copying summaries twice or failing on the dropped column |
| interrupted before any one statement and run again, the migration ends in the clean run's snapshot | a statement that cannot be re-issued after a partial run — for example the summary copy without `ON CONFLICT(id) DO NOTHING`, so a restart between the copy and the drop fails on the primary key |

A stored layout that the migration's frozen schema rejects makes `up` throw; no test covers it, because no released version has a writer that can store such a layout [spec-writer_41: git log over app/db/table-config/layout-schema.ts — one commit, 70e76180, identical at all 25 tags; ran each tag's seed layouts through the frozen schema — observed no failure; app/db/table-config/update.ts:18-25 and create.ts:7-10,24 store only `tableLayoutSchema`-parsed layouts].

### `app/db/_migrations/__tests__/runMigrations.test.ts`

`// @vitest-environment node`; no `vi.mock` (the same departure as above). Each test opens its own database and calls `runMigrations(db)` from `@db/_migrations` directly.

| Test | Defect it catches |
| --- | --- |
| on a fresh database every migration runs and `_migrations` holds one row per id, in `migrations` order | a missing ledger write, so every launch re-runs migrations |
| a second call resolves and leaves every ledger row and its `applied_at` unchanged | applied migrations re-running (their ledger insert would fail on the primary key and block startup) |
| after `applyMigrationsBefore(db, '1789304154994')`, the test runs `CREATE TABLE _migrations (id TEXT PRIMARY KEY, applied_at TEXT NOT NULL)` and inserts the ten earlier ids with a fixed `applied_at`; one call then runs only the last two migrations: the legacy tables are gone, `base_entity_content_sections` exists, and the ten earlier rows keep their `applied_at` | pending migrations skipped, or applied ones re-run |
| with `db.failOnCall(4)` — calls 1 and 2 are `runMigrations`' own `CREATE TABLE IF NOT EXISTS _migrations` and ledger `SELECT`, calls 3 and 4 the first two statements of `1779321600000_initial_schema` — `runMigrations` rejects with `Injected failure` and `_migrations` holds no row; a second call on the same database completes the chain with all twelve ids | a ledger row written before or despite a failed `up` (with the insert moved before `up`, call 3 would write the first migration's ledger row), so the half-applied migration never resumes |
| every `migrations` id matches `/^\d{13}$/`, the ids are strictly ascending compared as strings, and the set of ids equals the set of 13-digit prefixes of the `.ts` files in `app/db/_migrations/`, each prefix appearing once | a new migration missing from the array or out of order — `migrationHead`, the last id, is the sync compatibility key peers compare — or an id of another length, which breaks the string comparison `applyMigrationsBefore` relies on |

Read the directory with `readdirSync(fileURLToPath(new URL('..', import.meta.url)))` from `node:fs` and `node:url`, filtered by `/^\d{13}_.+\.ts$/`.

### `app/db/__tests__/init-database.test.ts`

`// @vitest-environment node`. This file needs a spy on `Database.load`, so it departs from the root KAD "Test-file wiring under Vitest 5" as that KAD names, and like every harness test it has no `mockSelect` to scope, departing from `.claude/rules/db-unit-tests.md` — Init path and `select` mocks as the same KAD states:

```ts
const load = vi.hoisted(() => vi.fn());
vi.mock('@tauri-apps/plugin-sql', () => ({ default: { load } }));
```

`beforeEach` calls `vi.resetModules()` and sets `load.mockImplementation(() => Promise.resolve(openTestDatabase()))`, importing `openTestDatabase` dynamically from `@db/__tests__/support/sqlite-test-database`. Vitest 5 clears the spy's calls before each test and keeps the implementation (`.claude/knowledge/vitest.md` — "Vitest 5 clears every mock's call history before each test by default"). Each test imports `initDatabase` and `getDatabase` from `@db/database` dynamically.

| Test | Defect it catches |
| --- | --- |
| two concurrent `initDatabase()` calls call `load` once and resolve to the same database | a race loading two databases and running migrations twice |
| `getDatabase()` after `initDatabase()` returns the same database without calling `load` again | the cache not being used |
| when `load` rejects once (`load.mockRejectedValueOnce`), both concurrent callers reject with that error, and a later `getDatabase()` calls `load` again and resolves | a failed init leaving the in-flight promise cached, so the app can never open its database |
| when a migration fails — `load.mockImplementationOnce` returns a database armed with `failOnCall(5)` — `initDatabase()` rejects, and a later call loads a fresh database and resolves | a failed migration leaving a half-initialized database cached |

### `app/db/table-config/__tests__/parse-layout-row.test.ts`

Pure TypeScript: default environment, no `vi.mock`. Imports `parseLayoutFromRow` from `../parse-layout-row`.

| Test | Defect it catches |
| --- | --- |
| a valid stored layout with an extra unknown key returns the layout without that key | unvalidated JSON reaching the list screen |
| a stored layout whose first column's `width` is `null` throws an error whose message starts with `Stored layout is invalid` | a corrupt layout accepted and crashing the list later |
