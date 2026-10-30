# ADR 0001 — Encounter combat state is derived from an append-only combat log

**Status:** Proposed, 2026-10-28. **Deciders:** Simon Schötz; proposed by Claude. **Product requirements:** `app/docs/_product/epics/encounter-screen.md`; requirement ids such as H8 below are that PRD's.

## Context

The PRD asks the storage for four things:

- One action can change the HP of many combatants and appears as one log entry (H8), reverted as a whole (L5).
- Any automatic log entry can be reverted, with every later entry staying in effect (L5), and a removal is revertible like an HP change (H9).
- The log is the record of the fight (L6), so it must never disagree with the HP the queue shows.
- One device runs a fight, and no player sees the screen (PRD Non-goals).

The platform constrains how those writes can be made:

- No write spanning several statements is atomic from TypeScript. tauri-plugin-sql checks out an arbitrary connection from a pool of 10 for each `execute()`/`select()` call, so `BEGIN`/`COMMIT` sent across separate calls guarantees nothing [encounter-adr_11: `~/.cargo/registry/src/index.crates.io-1949cf8c6b5b557f/tauri-plugin-sql-2.5.0/src/wrapper.rs:78-101` — `DbPool::connect()` calls `Pool::connect(conn_url)` with no `PoolOptions` override] [architect_2: `~/.cargo/registry/.../sqlx-core-0.8.6/src/pool/options.rs:151` — default `max_connections: 10`].
- The plugin's source exposes its own pool to Rust code: the `sqlite()` accessor is commented out, but the pools sit in public app state whose `DbPool::Sqlite` variant is public, and sqlx's `Pool::begin()` opens a transaction on such a pool [encounter-adr_12: `~/.cargo/registry/src/index.crates.io-1949cf8c6b5b557f/tauri-plugin-sql-2.5.0/src/wrapper.rs:30-33` — `pub enum DbPool` with variant `Sqlite(Pool<Sqlite>)`, `wrapper.rs:46-74` — `pub fn sqlite()` inside a `/* … */` block; `src/lib.rs:27,49,233` — `pub use wrapper::DbPool`, `pub struct DbInstances(pub RwLock<HashMap<String, DbPool>>)`, `app.manage(instances)`] [encounter-adr_20: `~/.cargo/registry/src/index.crates.io-1949cf8c6b5b557f/sqlx-core-0.8.6/src/pool/mod.rs:371-373` — `Pool::begin()` returns a `Transaction` on a connection acquired from the pool]. No command of this repository reaches it yet, and none has been compiled to try it [encounter-adr_21: ``grep -rn "DbInstances\|DbPool" app/src-tauri/src`` — not found].
- One SQL statement is atomic: outside `BEGIN` it runs in its own implicit transaction, and under the default ABORT conflict algorithm a constraint failure backs out everything that statement changed, so a multi-row `INSERT` with no conflict clause lands whole or not at all [encounter-adr_13: `https://www.sqlite.org/lang_transaction.html` — "Any command that accesses the database … will automatically start a transaction if one is not already in effect"; "Automatically started transactions are committed when the last SQL statement finishes."] [encounter-adr_14: `https://www.sqlite.org/lang_conflict.html` — ABORT "backs out any changes made by the current SQL statement"; "The default conflict resolution algorithm is ABORT."].
- A raw `BEGIN` sent through `execute()` whose transaction then fails returns its connection to the pool still inside the open transaction, with nothing to roll it back [architect_5: `~/.cargo/registry/.../sqlx-core-0.8.6/src/transaction.rs:264-274` — a `Transaction` opened via `Connection::begin()` gets an automatic rollback queued on `Drop`, even when the connection returns to a pool] [architect_6: `~/.cargo/registry/.../sqlx-sqlite-0.8.6/src/connection/mod.rs:556` — `in_transaction()` (backed by the real `sqlite3_get_autocommit` C API) has zero callers anywhere in the crate].
- Sync replaces a local row with an incoming one when the incoming `updated_at` is newer, row by row [encounter-adr_1: `app/db/_sync/apply-upsert.ts` — as of 98592344], and two peers sync only while both their `SYNC_PROTOCOL_VERSION` and their migration head match [encounter-adr_2: `app/services/syncService.ts` — as of 98592344].
- Existing writes that touch several rows already compose separate calls without atomicity: reordering session steps writes one `sort_order` update per step [encounter-adr_3: `app/services/sessionStepService.ts` — as of 98592344].
- Row timestamps are `new Date().toISOString()`, with millisecond precision [encounter-adr_4: `app/db/util/generate-db-timestamps.ts` — as of 98592344].

## Options

- **A. Mutable HP columns plus a separate log table.** Each combatant row holds current, max and temp HP and a defeated flag; an action updates every target row and inserts a log entry. A mass action is n + 1 statements, so a failure part-way leaves some targets changed, or HP and log disagreeing. A revert has to work out and write inverse values per target, and a revertible removal needs a soft-delete column besides.
- **B. The log is the source of truth.** Queue item rows hold only what the GM edits directly: order, names, notes, the starting max HP. Current, max and temp HP, the defeated mark and the removal are derived by folding the encounter's log entries in order. Each action is exactly one `INSERT`, a mass action included, and a single SQLite statement is atomic. A revert is one more `INSERT` that names the entry it reverts; the derivation skips reverted entries.
- **C. Option A, made atomic by a Rust command.** A command takes the action's statements and runs them in one sqlx transaction on the plugin's own pool (encounter-adr_12). The writes become atomic, but the app gains its first Rust database command, a new member in `app/platform/` and its emulation in the dev data server for web mode, and a revert is still an inverse write per target.

## Decision

Option B: a fight's combat state is a pure derivation of the encounter's queue items and its append-only log entries.

A cannot keep the PRD's promise that the log never disagrees with the queue, because its n + 1 statements are not atomic. C keeps that promise, at the cost of a new database path through Rust, the platform module and the dev data server. Even so, a revert under C still has to compute and write inverse values, and "as if the entry never happened" (L5) is hard to get exactly that way. B gets atomicity from one `INSERT` per action (encounter-adr_13, encounter-adr_14) and makes revert and removal fall out of the derivation instead of being written back.

A transaction command as in C would also make today's multi-call writes (duplicate, reorder) atomic. That is infrastructure for the whole app, outside this decision.

## Data

### `encounter_queue_items`

| Column | Type | Meaning |
| --- | --- | --- |
| `id` | `TEXT` primary key | |
| `encounter_id` | `TEXT NOT NULL`, FK `encounters` `ON DELETE CASCADE` | |
| `kind` | `TEXT NOT NULL`: `combatant` or `event` | discriminates the two queue item kinds |
| `base_entity_id` | `TEXT`, FK `base_entities` `ON DELETE SET NULL` | the entity of an entity combatant; null for an ad-hoc combatant, an event, or a combatant whose entity was deleted (E1) |
| `name` | `TEXT` | an event's name or an ad-hoc combatant's typed name, null once the GM clears it; for an entity combatant, the entity's name when it was added, null when it had none, shown only once the entity is gone (E1) |
| `custom_name` | `TEXT` | a combatant's rename; null shows the derived name |
| `sequence_number` | `INTEGER` | a combatant's number within its numbering key (Naming below); null for events |
| `starting_max_hp` | `INTEGER` | a combatant's max HP when added; null when HP is not set; null for events |
| `notes` | `TEXT` | Lexical editor state, as the app's other text fields store it |
| `sort_order` | `INTEGER NOT NULL` | one order shared by combatants and events |
| `created_at`, `updated_at` | `TEXT NOT NULL` | |

Combatants and events share one table so that the queue has one `sort_order` to drag within. These columns are edited by the GM directly and saved like other text fields; none of them is combat state.

`name` is nullable for two reasons. A text column the user can clear must be [encounter-adr_24: `app/db/CLAUDE.md` — "User-editable text columns are nullable" — as of 9c92e901]. And an entity's own `name` is nullable [encounter-adr_25: `app/db/base-entity/schema.ts` — `name` has `z.string().nullable()` and no `notNull` — as of 9c92e901], which an entity duplicate leaves empty [encounter-adr_26: `app/db/base-entity/duplicate.ts` — `name` is excluded from the copied columns with no override — as of 9c92e901], so a `NOT NULL` column would make adding such an entity fail.

### `encounter_log_entries`

| Column | Type | Meaning |
| --- | --- | --- |
| `id` | `TEXT` primary key | |
| `encounter_id` | `TEXT NOT NULL`, FK `encounters` `ON DELETE CASCADE` | |
| `kind` | `TEXT NOT NULL` | one of the kinds below |
| `payload` | `TEXT NOT NULL` | JSON whose shape `domain/` validates per `kind` with zod, as content section content is validated |
| `created_at`, `updated_at` | `TEXT NOT NULL` | `created_at` orders the log, `rowid` breaks ties (Derivation) |

An entry is never updated. A typed message may be deleted (L4); no other entry ever is. The log's db module enforces this: it offers a create, a read of all entries of one encounter, and a delete whose `WHERE` clause includes `kind = 'message'`, and no update.

| `kind` | `payload` | Revertible |
| --- | --- | --- |
| `message` | the Lexical editor state of the typed message | no; deletable instead |
| `added` | the ids of the queue items added | no |
| `removed` | the ids of the queue items removed | yes |
| `damage`, `heal` | per target: the queue item id and the amount entered | yes |
| `temp-hp`, `max-hp` | per target: the queue item id and the value entered | yes |
| `defeated`, `undefeated` | the ids of the combatants marked or unmarked | yes |
| `revert` | the id of the entry it reverts | no |

An entry stores what the GM entered, never the values that resulted. The resulting values depend on everything before the entry, so storing the input is what lets a revert recompute the fight without that entry.

A stored payload is never rewritten, so its shape is permanent: a kind's payload schema may only change in ways that still parse every payload stored under it, and a change of meaning is a new kind.

### Elsewhere

- `encounters` gains `hide_defeated INTEGER NOT NULL DEFAULT 0` (Q6), added through `ensureColumn` as an earlier column migration adds its column [encounter-adr_36: ``grep -rln ensureColumn app/db`` — found `app/db/util/ensure-column.ts` and `app/db/_migrations/1786002768594_add_pinned_order.ts`].
- The Add tab's entity-type filter (A2) is a key in `_settings`, which is not a synced table [encounter-adr_5: `app/db/_sync/registry.ts` — as of 98592344], so each device keeps its own.
- The migration creates both tables with their three sync triggers frozen into the migration file, as `1786186021664_add_encounters.ts` does for `encounters` [encounter-adr_35: `app/db/CLAUDE.md:82` — as of 9c92e901].
- Both new tables join `SYNCED_TABLES` directly after `encounters`, which already follows `base_entities` [encounter-adr_37: `app/db/_sync/registry.ts` — as of 9c92e901], with `encounter_queue_items` before `encounter_log_entries`, so a peer receives the items an entry names before the entry. A build with the new migrations has a new migration head, so it pauses sync with an older build by itself (encounter-adr_2).

## Derivation

One pure function in `domain/` takes an encounter's queue items and its log entries, in the order the db read returns them, and returns:

- per queue item: max HP, current HP, temp HP, defeated, removed;
- the ids of the entries a revert drops, which the Log tab marks as reverted;
- the ids of the entries it could not read, which the Log tab shows as unreadable.

The Log tab offers Revert on a readable entry of a revertible kind that is not in the first set, so the UI never works out for itself which entries are in effect.

1. Every combatant starts at max HP = `starting_max_hp`, current HP = max HP, temp HP 0, not defeated, not removed; every event starts not removed.
2. Every entry named by a `revert` entry is dropped. A `revert` that names another `revert`, a non-revertible kind or an unreadable entry is ignored.
3. The remaining entries are applied in the order given, with the PRD's HP rules: damage takes temp HP first and leaves current HP without a floor (H3); heal stops at max HP (H4); temp HP is replaced (H5); a new max sets current HP when HP was not set and clamps current HP down when it is lower (H6). Damage or heal for a combatant whose HP is not set changes nothing; the UI does not offer it (H7). `removed` marks its items removed; `defeated` and `undefeated` set and clear the mark on their combatants; `added` and `message` change nothing. A target id with no queue item, possible mid-sync because sync is not transactional across tables, is skipped, and the entry's other targets still apply.
4. An entry whose kind is unknown, or whose payload fails its kind's schema, applies nothing and is returned as unreadable: the function never throws on a stored entry. A throw would make the encounter unreadable for good, since such an entry can be neither edited nor deleted, and a peer's row reaches this database checked only against the table's column schema [encounter-adr_28: `app/db/_sync/apply-upsert.ts` — a peer row passes `entry.zodSchema.partial().safeParse` — as of 9c92e901], where `payload` is a string column.

The db read returns entries `ORDER BY created_at, rowid`. SQLite gives a row inserted without an explicit rowid one more than the table's largest existing rowid [encounter-adr_44: `~/.cargo/registry/src/index.crates.io-1949cf8c6b5b557f/libsqlite3-sys-0.30.1/sqlite3/sqlite3.c:98629-98630,98651-98664` — `OP_NewRowid`: "First we attempt to find the largest existing rowid and add one to that"] [encounter-adr_29: `https://www.sqlite.org/autoinc.html` — "The usual algorithm is to give the newly created row a ROWID that is one larger than the largest ROWID in the table prior to the insert."], so `rowid` puts two entries of the same millisecond in the order this device inserted them; `id`, a random nanoid, would order them at random [architect_9: ran `node -e` on node:sqlite 3.53.4 in an in-memory database — observed `ORDER BY created_at, id` return equal-`created_at` rows as insert-1, insert-3, insert-2, insert-0 and `ORDER BY created_at, rowid` return them in insertion order]. The tables have text primary keys and are not `WITHOUT ROWID` tables, so `rowid` is SQLite's own column [architect_10: ``grep -rn "WITHOUT ROWID" app/db --include=*.ts`` — not found].

The queue's numbering (A4) is computed from the same result, because whether a combatant still counts depends on whether it is removed.

## Naming

- **Numbering key:** `base_entity_id` for an entity combatant; `name` for an ad-hoc combatant or one whose entity was deleted.
- **`sequence_number`:** on add, the highest number used for that key in the encounter, removed combatants included, plus one, so a number is never reused. A combatant keeps its number when its entity is deleted and its key becomes `name`, so it can then share a number with an ad-hoc combatant of the same name. The PRD accepts this, since renumbering would change names the GM has already seen.
- **Shown name:** `custom_name` when set, as typed and without a number; otherwise the entity's current name while an entity is linked; otherwise `name`; otherwise "Untitled Combatant" or "Untitled Event", as a session step without a name shows "Untitled Step" [encounter-adr_27: `app/domain/session-steps/sessionStepName.ts` — as of 9c92e901]. The derived name, every case but `custom_name`, is followed by `sequence_number` while two or more combatants of that key are not removed. The name is computed at render and never stored as text, so it follows an entity rename and the A4 rule.
- **Log lines** show names the same way. A rename, or a number dropped once a sibling is removed, changes how earlier lines read; the entries name their targets by id, which stays exact, and the PRD accepts the changed wording.

## Writes

- **Add (A3, A6):** one multi-row `INSERT` of the new queue items, then one `added` entry. The derivation does not read `added`, so a failure between the two only loses that log line. The db layer's only insert builder writes one row [encounter-adr_33: `app/db/util/build-create-query.ts` — `buildCreateQuery` builds one `VALUES (…)` group — as of 9c92e901], so a multi-row builder joins it in `app/db/util/`. `sort_order` and `sequence_number` are computed from a read just before the insert, and Add is disabled while its write is pending, so a double click cannot hand out a number twice. The bundled SQLite caps one statement at 32766 bound parameters by default [encounter-adr_32: `~/.cargo/registry/src/index.crates.io-1949cf8c6b5b557f/libsqlite3-sys-0.30.1/sqlite3/sqlite3.c:13892-13893` — `# define SQLITE_MAX_VARIABLE_NUMBER 32766` unless already defined] [encounter-adr_41: `~/.cargo/registry/src/index.crates.io-1949cf8c6b5b557f/libsqlite3-sys-0.30.1/build.rs:266-268` — the bundled build defines `SQLITE_MAX_VARIABLE_NUMBER` from the environment variable of that name when it is set] [encounter-adr_42: ran `cargo tree --offline -e features -i libsqlite3-sys` in `app/src-tauri/` — observed the `bundled` feature enabled through `sqlx-sqlite`] [encounter-adr_43: ``grep -rn SQLITE_MAX_VARIABLE_NUMBER .github app/src-tauri`` — not found], so the quantity inputs are capped at 99.
- **Reorder (Q4):** the reorder takes the encounter's full list in `sort_order` order, hidden-defeated and removed items included, moves the dragged block directly before or after the visible item it is dropped on, and rewrites `sort_order` for every row, one update per row as the session step reorder does (encounter-adr_3). A hidden or removed item keeps its place between its neighbours, so it comes back where it was (Q6, L5). Queue items are read `ORDER BY sort_order, id`. Order is not combat state, so a reorder that fails part-way only leaves an order the GM can drag again.
- **Duplicate (D1):** the encounter row first, then each copied queue item through `buildDuplicateQuery`, which the Duplication rule requires, one statement per item as `duplicateBySession` copies session steps [encounter-adr_34: `app/db/CLAUDE.md` — Duplication; `app/db/session-step/duplicate-by-session.ts` — one `buildDuplicateQuery` and `execute` per step in a loop — as of 9c92e901]. The overrides are the new `encounter_id` and a `starting_max_hp` taken from the source's current derived max HP. Only items the derivation does not mark removed are copied.

## Consequences

- An action, mass action included, is one statement: HP and the log cannot disagree, and a group action applies to all its targets or to none.
- A revert, a removal and the revert of a removal need no snapshot of earlier values; "as if the entry never happened" (L5) is exact by construction.
- Appended rows never compete in row-by-row sync. A peer that receives entries in another order still derives the same state, because the order comes from `created_at`, not from arrival; only entries of the same millisecond fall back to the peer's own `rowid`, which follows arrival.
- The derivation is a pure function, testable in isolation, which suits `mutation-check`.
- HP cannot be shown before the encounter's whole log has loaded. The screen reads all queue items and all log entries of the encounter in two queries and derives on the client; deriving is linear in the number of entries, a few hundred in a long fight.
- The log can be neither pruned nor edited without changing the fight. Deleting a typed message is safe because messages carry no state.
- Duplicate is one statement per queue item, so a failure part-way leaves a partial copy, which the GM deletes, as a failed session duplicate does today.
- The order of the log depends on the clock of the device that wrote it. Timestamps are UTC, so a change between summer and winter time does not move it [encounter-adr_40: ran `TZ=Europe/Berlin node -e` on two instants 1 ms apart across the 2026-10-25 change — observed local time step back from 02:59:59 to 02:00:00 while `toISOString()` moved from `2026-10-25T00:59:59.999Z` to `2026-10-25T01:00:00.000Z`]. A backward correction of the clock during a fight sorts entries written after it before those written just before it; the result changes only where the order of two entries decides it, such as damage and a heal near max HP. Simon Schötz accepted this risk on 2026-10-28. Two devices writing into one fight could interleave wrongly too, which the PRD rules out (one device per fight).
- `VACUUM` may change the rowids of a table without an `INTEGER PRIMARY KEY` [encounter-adr_30: `https://www.sqlite.org/lang_vacuum.html` — "The VACUUM command may change the ROWIDs of entries in any tables that do not have an explicit INTEGER PRIMARY KEY."]. The backup and the dev data mirror copy the database with `VACUUM INTO` [encounter-adr_31: `app/db/database-backup.ts`, `app/dev-data-server/installedAppData.ts` — as of 9c92e901]. The page's only sentence about rowids names plain `VACUUM` [encounter-adr_45: ran `curl -sS https://www.sqlite.org/lang_vacuum.html` and a case-insensitive grep for `rowid` over the tag-stripped text — observed one match, the sentence quoted above], but it describes `VACUUM INTO` as the same copy written into the named file instead of a temporary one, so a restored or mirrored copy may reorder entries of the same millisecond. Entries with distinct timestamps keep their order.
- A revert recomputes the fight instead of adding the entry's amounts back to today's values. The two differ only where temp HP was set between the entry and its revert; the PRD's Decisions table records this choice.

## Follow-ups for the spec

- `ReorderableNavList` drags one item at a time and renders a label per item [encounter-adr_6: `app/src/components/ReorderableNavList/ReorderableNavList.tsx` — as of 98592344]. The queue needs images, HP, selection and block drag, so it is a new component on the same `@dnd-kit/core` and `@dnd-kit/sortable` packages. `reorderIds` sits behind that component's `index.ts`, which exports only `ReorderableNavList` [encounter-adr_7: `app/src/components/ReorderableNavList/index.ts` — as of 98592344]; reusing it means moving it.
- The content section panel now sits in `screens/components/ScreensBaseEntityContentSectionPanel` and takes the entity id as a prop, so the entity screen and the encounter's middle column (V1) both render it [implement_1: `app/src/screens/components/ScreensBaseEntityContentSectionPanel/ScreensBaseEntityContentSectionPanel.tsx:27-29`].
- `ScreensTextEditorLayout` is two columns with a maximum width of sidebar plus text editor [encounter-adr_10: `app/src/screens/components/ScreensTextEditorLayout/ScreensTextEditorLayout.css` — as of 98592344]; the three-column encounter screen gets its own layout, as `SessionScreen` has.
- The backlog plans a tabbed right sidebar for entity screens as well (`app/docs/_product/backlog.md`, "Feature: Right sidebar"), which makes the Add / Actions / Log tab container a candidate for `app/src/components/`.
- HP actions and typed messages are written on Apply or Enter, without the autosave delay; names and notes use the existing autosave path.
- The two new reads, an encounter's queue items and its log entries, get query keys in `encounterKeys`, which has only `list` and `detail` [encounter-adr_38: `app/src/data-access-layer/encounters/encounterKeys.ts` — as of 9c92e901].
- Set max HP accepts 0 (H10), so the health overlay (Q2) shows a combatant with max HP 0 as fully lost instead of dividing by zero.
- The new terms (queue item, combatant, encounter event, combat log) belong in `app/CLAUDE.md` — Domain Glossary once the tables exist, and `app/docs/_product/domain-scaffold.md` is checked per `app/docs/CLAUDE.md` — Spec Format Extension. Its Detail Screen Composition section calls `EncounterScreen` a deliberately minimal base for a future encounter screen [encounter-adr_39: `app/docs/_product/domain-scaffold.md` — Detail Screen Composition, the `screens/encounter/` bullet — as of 9c92e901]; that bullet is rewritten for the three-column screen.
