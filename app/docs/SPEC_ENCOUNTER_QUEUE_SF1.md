# Sub-feature 1: Combat schema

Creates the tables `encounter_queue_items` and `encounter_log_entries` with their sync triggers, adds `encounters.hide_defeated`, registers both tables for sync, and adds the db modules that write and read them. Nothing is user-visible. SF2's `encounterQueueService` is the first consumer of `createMany`, `getAllByEncounter`, `update` and the log `create`.

## Files affected

Modified:

- `app/domain/encounters/index.ts` — explicit named exports in the file's one-statement-per-name style: `serializeLogEntryPayload` and, as `export type`, `LogEntryKind`, `LogEntryPayload`
- `app/db/encounter/schema.ts` — add the `hide_defeated` column
- `app/db/encounter/__tests__/create.test.ts`, `get.test.ts`, `duplicate.test.ts` — the full encounter row each one compares with `toEqual` gains `hide_defeated: 0` (create: the row `readEncounters` reads; get: the row `get` returns; duplicate: the copy `readEncounter` reads)
- `app/db/encounter/__tests__/remove.test.ts` — new case, below
- `app/db/base-entity/__tests__/remove.test.ts` — new case, below
- `app/db/adventure/__tests__/remove.test.ts` — `seedAdventureWithChildren` seeds one queue item (via `createMany`, on the seeded base entity) and one `added` log entry under the seeded encounter; `countChildRows` counts `encounter_queue_items` and `encounter_log_entries`; both expected objects gain them (0 after the delete, 1 for the kept adventure)
- `app/db/util/index.ts` — explicit export `buildCreateManyQuery`
- `app/db/_migrations/index.ts` — import and append the new migration as the last array element
- `app/db/_sync/registry.ts` — `syncedTable('encounter_queue_items', encounterQueueItemTable)` then `syncedTable('encounter_log_entries', encounterLogEntryTable)` directly after `encounters`, each table imported from its module's `index.ts`; the comment above `SYNCED_TABLES` gains "encounter_queue_items and encounter_log_entries after encounters"
- `app/src/data-access-layer/encounters/__tests__/useEncounter.test.ts` — `encounterRow` gains `hide_defeated: 0` (`Encounter` gains a non-optional field; `tsc` fails without it)

Deleted: none

New:

- `app/domain/encounters/logEntryPayloads.ts`, `app/domain/encounters/__tests__/logEntryPayloads.test.ts`
- `app/db/util/build-create-many-query.ts`, `app/db/util/__tests__/build-create-many-query.test.ts`
- `app/db/encounter-queue-item/schema.ts`, `types.ts`, `index.ts`, `create-many.ts`, `get-all-by-encounter.ts`, `update.ts`, and `__tests__/create-many.test.ts`, `get-all-by-encounter.test.ts`, `update.test.ts`
- `app/db/encounter-log-entry/schema.ts`, `types.ts`, `index.ts`, `create.ts`, `__tests__/create.test.ts`
- `app/db/_migrations/<Date.now() at creation>_add_encounter_queue_and_log.ts`

Moved: none

Draft: none

## Layered breakdown

### Domain

`logEntryPayloads.ts` holds one module-private record from log entry kind to zod schema, with only the `added` kind, and exports two types derived from it and one function:

```ts
const LOG_ENTRY_PAYLOAD_SCHEMAS = {
  added: z.object({ queueItemIds: z.array(z.string()).min(1) }),
} as const;

export type LogEntryKind = keyof typeof LOG_ENTRY_PAYLOAD_SCHEMAS;
export type LogEntryPayload<K extends LogEntryKind> = z.infer<
  (typeof LOG_ENTRY_PAYLOAD_SCHEMAS)[K]
>;
export declare const serializeLogEntryPayload: <K extends LogEntryKind>(
  kind: K,
  payload: LogEntryPayload<K>,
) => string;
```

`serializeLogEntryPayload` parses the payload with its kind's schema and returns `JSON.stringify` of the parsed value; a ZodError propagates. The `added` shape is permanent once stored (KAD "The `added` payload is `{ "queueItemIds": string[] }` with at least one id"). [spec-writer_5: ran `npx tsc --noEmit` and `npx eslint` on two scratch files, one with this record, these types and a body for the function and one with the `useAdventureBaseEntities` hook of the data access layer — observed no type error and only the unused-export lint report]

Test behaviors (`logEntryPayloads.test.ts`):

- serializes a valid payload to the JSON string of exactly its fields — catches a serializer that writes a different shape than the stored-forever one
- rejects an empty `queueItemIds` and a non-string id — catches a schema that lets an unreadable payload be stored for good

### Database

`db/encounter/schema.ts`: `hide_defeated: { type: 'INTEGER', notNull: true, default: '0', zod: z.number() }`. `db/encounter/create.ts` and `duplicate.ts` stay unchanged (the SQL default fires on create).

Columns of the two new tables (the migration's frozen SQL is what each `createTableSQL` produces for them, `FOREIGN KEY` lines after the columns):

| `encounter_queue_items` | SQL | zod |
| --- | --- | --- |
| `id` | `TEXT` primary key | `z.string()` |
| `encounter_id` | `TEXT NOT NULL`, FK `encounters(id)` `ON DELETE CASCADE` | `z.string()` |
| `kind` | `TEXT NOT NULL` | `z.enum(['combatant', 'event'])` |
| `base_entity_id` | `TEXT`, FK `base_entities(id)` `ON DELETE SET NULL` | `z.string().nullable()` |
| `name`, `custom_name`, `notes` | `TEXT` | `z.string().nullable()` |
| `sequence_number`, `starting_max_hp` | `INTEGER` | `z.number().nullable()` |
| `sort_order` | `INTEGER NOT NULL` | `z.number()` |
| `created_at`, `updated_at` | `TEXT NOT NULL` | `z.string()` |

| `encounter_log_entries` | SQL | zod |
| --- | --- | --- |
| `id` | `TEXT` primary key | `z.string()` |
| `encounter_id` | `TEXT NOT NULL`, FK `encounters(id)` `ON DELETE CASCADE` | `z.string()` |
| `kind` | `TEXT NOT NULL` | `z.string()` |
| `payload` | `TEXT NOT NULL` | `z.string()` |
| `created_at`, `updated_at` | `TEXT NOT NULL` | `z.string()` |

The log's `kind` is `z.string()`, not an enum, because a peer's row passes only the column schema (`db/_sync/apply-upsert.ts`) and Slice 2's derivation must return an unknown kind as unreadable. Each table is declared with `defineTable` in its `schema.ts` and exported as `encounterQueueItemTable` and `encounterLogEntryTable`.

`db/encounter-queue-item/types.ts`:

```ts
export type EncounterQueueItem = z.infer<typeof encounterQueueItemTable.zodSchema>;
export type CreateEncounterQueueItemInput = {
  encounter_id: string;
  kind: 'combatant';
  base_entity_id: string;
  sequence_number: number;
  sort_order: number;
  name?: string;
  starting_max_hp?: number;
};
export type UpdateEncounterQueueItemInput = z.infer<typeof encounterQueueItemTable.updateSchema>;
```

`db/encounter-log-entry/types.ts` holds only `CreateEncounterLogEntryInput = { encounter_id: string; kind: LogEntryKind; payload: LogEntryPayload<LogEntryKind> }` (both types from `@domain`). [spec-writer_6: ran `npx tsc --noEmit` and `npx eslint` on scratch files declaring both table schemas and these types — observed no type error except the `@domain` exports `LogEntryKind` and `LogEntryPayload`, which the Domain layer above adds, and only the unused-export lint report]

Barrels, explicit named exports: `encounter-queue-item/index.ts` exports `encounterQueueItemTable`, `createMany`, `getAllByEncounter`, `update` and `type EncounterQueueItem`; `encounter-log-entry/index.ts` exports `create` and `encounterLogEntryTable`. Nothing outside imports the other types.

Functions:

- `createMany(rows: CreateEncounterQueueItemInput[]): Promise<string[]>`: `assertValidId` on each row's `encounter_id` and `base_entity_id`; one `generateDbTimestamps()` per call and one `generateId()` per row; each row a typed object built as `db/session-step/create.ts` builds its own, with the keys in the order `encounter_id`, `kind`, `base_entity_id`, `sequence_number`, `sort_order`, `created_at`, `updated_at`, then `name` and `starting_max_hp` only when not `undefined`; one `db.execute` of `buildCreateManyQuery`; returns the ids in input order. All rows of one call carry the same optional fields, because the builder rejects rows whose keys differ.
- `getAllByEncounter(encounterId: string): Promise<EncounterQueueItem[]>`: `assertValidId`, then `SELECT * FROM encounter_queue_items WHERE encounter_id = $1 ORDER BY sort_order ASC, id ASC`.
- `update(id, data)`: `db/session-step/update.ts` with table `encounter_queue_items` and entity name `'Encounter queue item'`.
- log `create(data: CreateEncounterLogEntryInput): Promise<string>`: `assertValidId(data.encounter_id, 'Encounter')`, `payload: serializeLogEntryPayload(data.kind, data.payload)` imported from `@domain`, then the `buildCreateQuery` shape of `db/session-step/create.ts` with keys `encounter_id`, `kind`, `payload`, `created_at`, `updated_at`. The module offers no update; Slice 3 adds the read and the delete restricted to `kind = 'message'`.

`db/util/build-create-many-query.ts`:

```ts
export declare const buildCreateManyQuery: <T extends Record<string, string | number | null>>(
  tableName: string,
  rows: { id: string; data: T }[],
) => { sql: string; values: unknown[] };
```

One `INSERT INTO <table> (id, <columns of the first row's data>) VALUES (…), (…)` with numbered placeholders that continue across rows (`$1`, `$2`, … never restarting per row) and `values` flattened row by row, id first. It throws a plain `Error` when `rows` is empty or when any row's keys differ from the first row's, in key order. A file-scoped `/* eslint-disable @typescript-eslint/no-unnecessary-type-parameters -- … */` above the declaration repeats the reason `build-create-query.ts` gives (prettier splits the type parameter across lines, so a next-line comment does not reach it) [spec-writer_4: ran `npx eslint` on a scratch file with this declaration — observed `no-unnecessary-type-parameters` on the type-parameter line without the comment, none with it]. A one-line comment at the interpolating statement names the fixed source: a literal table name at each caller and the keys of a row-typed object (`app/db/CLAUDE.md` — Conventions, "Values are always bound").

#### Migration

`<Date.now() at creation>_add_encounter_queue_and_log.ts` (greater than the current head `1789743068849`) exports `addEncounterQueueAndLogMigration: Migration` whose `id` equals the file's timestamp. `up`, in this order: (1) execute two frozen `CREATE TABLE IF NOT EXISTS` constants, the two tables above; (2) for each of the two table names execute the INSERT, UPDATE and DELETE trigger statements from a frozen local copy of `buildTriggerSQL` in `1784365870026_add_sync_infrastructure.ts`; (3) `ensureColumn(db, 'encounters', 'hide_defeated', 'ALTER TABLE encounters ADD COLUMN hide_defeated INTEGER NOT NULL DEFAULT 0')` imported from `../util/index.ts` as `1786002768594_add_pinned_order.ts` does. A comment above each frozen block states what is frozen, where its live equivalent lives and why a migration never depends on it (`app/db/CLAUDE.md` — Migrations). Every statement is safe to re-issue, so no migration test is required (`app/db/CLAUDE.md` — Testing). From its source, reasoned and not run, `db/_sync/__tests__/registry.test.ts` checks the six triggers, the registry columns against the migrated tables, the null-accepting `zodSchema` fields and the registry order of both new tables. The columns `custom_name`, `notes` and `hide_defeated` and the kind `event` have no reader in this branch; Slices 2, 5 and 6 read them, and the epic's one migration creates every column. Unchanged after reading: `app/db/encounter/__tests__/update.test.ts` (it compares against a row read before the update) and `app/domain/index.ts` (`export * from './encounters'` passes the new exports through, as `app/domain/CLAUDE.md` — Structure permits).

#### Test behaviors

- `build-create-many-query.test.ts`: placeholders continue across rows and values flatten row by row with the id first — catches a builder that restarts `$1` per row and binds one row's values twice; a `null` value is kept as `null`; rows with different keys throw and an empty `rows` throws — catches a silently misaligned INSERT
- `create-many.test.ts`: stores every row with the encounter, kind, base entity, sequence number and sort order it was given, and returns the new ids in input order — catches values shifted between rows or ids returned in another order; a row without `name` and `starting_max_hp` stores `NULL` in both and a row with them stores them — catches an omitted-key path that writes a literal
- `get-all-by-encounter.test.ts`: returns only the given encounter's rows, ordered by `sort_order` and then by `id` for equal `sort_order` (fixture: a second encounter's row, rows written out of order, two rows of equal `sort_order`) — catches a missing `WHERE` and a wrong order
- `update.test.ts`: writes `sort_order` and a new `updated_at`, leaves the other columns and the other rows untouched (fixed clock) — catches an update that touches the wrong row or leaves `updated_at` stale
- `encounter-log-entry/__tests__/create.test.ts`: stores the encounter id, kind and the payload as the JSON string `serializeLogEntryPayload` returns, and equal `created_at` and `updated_at`; a payload with an empty `queueItemIds` rejects and stores no row (read straight from the database) — catches validation skipped before the write
- `db/encounter/__tests__/remove.test.ts` new case: removing an encounter removes its queue items and log entries and leaves another encounter's — catches a missing cascade (read both tables from the database)
- `db/base-entity/__tests__/remove.test.ts` new case: removing a base entity keeps the queue items that named it, now with `base_entity_id` `NULL` and their `name` unchanged — catches E1 losing combatants of a deleted entity
- `db/adventure/__tests__/remove.test.ts`: both new tables count 0 for the removed adventure and 1 for the kept one — catches a cascade chain broken at `encounters`

[MANUAL-VERIFY] A queue item and a log entry added on one device appear on a paired device after sync. The check needs two devices and the native host, so it is a hand test for the human tester.
