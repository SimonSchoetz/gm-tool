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
| `name` | `TEXT NOT NULL` | an event's name; an ad-hoc combatant's typed name; for an entity combatant, the entity's name when it was added, shown only once the entity is gone |
| `custom_name` | `TEXT` | a combatant's rename; null shows the derived name |
| `sequence_number` | `INTEGER` | a combatant's number within its numbering key (Naming below); null for events |
| `starting_max_hp` | `INTEGER` | a combatant's max HP when added; null when HP is not set; null for events |
| `notes` | `TEXT` | Lexical editor state, as the app's other text fields store it |
| `sort_order` | `INTEGER NOT NULL` | one order shared by combatants and events |
| `created_at`, `updated_at` | `TEXT NOT NULL` | |

Combatants and events share one table so that the queue has one `sort_order` to drag within. A reorder rewrites `sort_order` for every item, as the session step reorder does (encounter-adr_3). These columns are edited by the GM directly and saved like other text fields; none of them is combat state.

### `encounter_log_entries`

| Column | Type | Meaning |
| --- | --- | --- |
| `id` | `TEXT` primary key | |
| `encounter_id` | `TEXT NOT NULL`, FK `encounters` `ON DELETE CASCADE` | |
| `kind` | `TEXT NOT NULL` | one of the kinds below |
| `payload` | `TEXT NOT NULL` | JSON whose shape `domain/` validates per `kind` with zod, as content section content is validated |
| `created_at`, `updated_at` | `TEXT NOT NULL` | `created_at` orders the log |

An entry is never updated. A typed message may be deleted (L4); no other entry ever is.

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

### Elsewhere

- `encounters` gains `hide_defeated INTEGER NOT NULL DEFAULT 0` (Q6).
- The Add tab's entity-type filter (A2) is a key in `_settings`, which is not a synced table [encounter-adr_5: `app/db/_sync/registry.ts` — as of 98592344], so each device keeps its own.
- Both new tables join `SYNCED_TABLES` after `encounters` and `base_entities`, whose rows they reference. A build with the new migrations has a new migration head, so it pauses sync with an older build by itself (encounter-adr_2).

## Derivation

One pure function in `domain/` takes an encounter's queue items and log entries and returns, per queue item: max HP, current HP, temp HP, defeated, removed.

1. Every combatant starts at max HP = `starting_max_hp`, current HP = max HP, temp HP 0, not defeated, not removed; every event starts not removed.
2. Every entry named by a `revert` entry is dropped. A `revert` that names another `revert` or a non-revertible kind is ignored.
3. The remaining entries are applied in order of `created_at`, then `id`, with the PRD's HP rules: damage takes temp HP first and leaves current HP without a floor (H3); heal stops at max HP (H4); temp HP is replaced (H5); a new max sets current HP when HP was not set and clamps current HP down when it is lower (H6). Damage or heal for a combatant whose HP is not set changes nothing; the UI does not offer it (H7).

The queue's numbering (A4) is computed from the same result, because whether a combatant still counts depends on whether it is removed.

## Naming

- **Numbering key:** `base_entity_id` for an entity combatant; `name` for an ad-hoc combatant or one whose entity was deleted.
- **`sequence_number`:** on add, the highest number used for that key in the encounter, removed combatants included, plus one, so a number is never reused.
- **Shown name:** `custom_name` when set; otherwise the entity's current name, or `name` when no entity is linked, followed by `sequence_number` while two or more combatants of that key are not removed. The name is computed at render and never stored as text, so it follows an entity rename and the A4 rule.

## Consequences

- An action, mass action included, is one statement: HP and the log cannot disagree, and a group action applies to all its targets or to none.
- A revert, a removal and the revert of a removal need no snapshot of earlier values; "as if the entry never happened" (L5) is exact by construction.
- Appended rows never compete in row-by-row sync. A peer that receives entries in another order still derives the same state, because the order comes from `created_at`, not from arrival.
- The derivation is a pure function, testable in isolation, which suits `mutation-check`.
- HP cannot be shown before the encounter's whole log has loaded. The screen reads all queue items and all log entries of the encounter in two queries and derives on the client; deriving is linear in the number of entries, a few hundred in a long fight.
- The log can be neither pruned nor edited without changing the fight. Deleting a typed message is safe because messages carry no state.
- Adding n combatants is one multi-row `INSERT` into `encounter_queue_items` and then one `added` entry. The derivation does not read `added`, so a failure between the two only loses that log line.
- Duplicate (D1) has to derive the source's current max HP per combatant to write the copies' `starting_max_hp`, and copies only queue items the derivation does not mark removed.
- The order of the log depends on the clock of the device that wrote it. Two devices writing into one fight could interleave wrongly, which the PRD rules out (one device per fight).
- A revert recomputes the fight instead of adding the entry's amounts back to today's values. The two differ only where temp HP was set between the entry and its revert; the PRD's Decisions table records this choice.

## Follow-ups for the spec

- `ReorderableNavList` drags one item at a time and renders a label per item [encounter-adr_6: `app/src/components/ReorderableNavList/ReorderableNavList.tsx` — as of 98592344]. The queue needs images, HP, selection and block drag, so it is a new component on the same `@dnd-kit/core` and `@dnd-kit/sortable` packages. `reorderIds` sits behind that component's `index.ts`, which exports only `ReorderableNavList` [encounter-adr_7: `app/src/components/ReorderableNavList/index.ts` — as of 98592344]; reusing it means moving it.
- `BaseEntityContentSectionPanel` takes the entity id from the route, `useParams` [encounter-adr_8: `app/src/screens/base-entity/components/BaseEntityContentSectionPanel/BaseEntityContentSectionPanel.tsx` — as of 98592344], and `app/src/screens/base-entity/index.ts` exports only `BaseEntityScreen` [encounter-adr_9: `app/src/screens/base-entity/index.ts` — as of 98592344]. Showing an entity in the encounter's middle column (V1) needs the id as a prop and the component in a place both screens can import from.
- `ScreensTextEditorLayout` is two columns with a maximum width of sidebar plus text editor [encounter-adr_10: `app/src/screens/components/ScreensTextEditorLayout/ScreensTextEditorLayout.css` — as of 98592344]; the three-column encounter screen gets its own layout, as `SessionScreen` has.
- The backlog plans a tabbed right sidebar for entity screens as well (`app/docs/_product/backlog.md`, "Feature: Right sidebar"), which makes the Add / Actions / Log tab container a candidate for `app/src/components/`.
- HP actions and typed messages are written on Apply or Enter, without the autosave delay; names and notes use the existing autosave path.
- The new terms (queue item, combatant, encounter event, combat log) belong in `app/CLAUDE.md` — Domain Glossary once the tables exist, and `app/docs/_product/domain-scaffold.md` is checked per `app/docs/CLAUDE.md` — Spec Format Extension.
