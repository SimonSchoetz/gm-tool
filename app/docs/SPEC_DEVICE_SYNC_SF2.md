# SF2: DB Sync Infrastructure

The change-tracking substrate: three infrastructure tables, 33 triggers, the synced-table registry, watermark accessors, and the verbatim apply writers. TypeScript + one migration; no dependency on SF1.

## Files Affected

Modified:

- `app/db/_migrations/index.ts` — register the new migration; add `export const migrationHead: string` derived as the last entry's id of the `migrations` array (inline in this file: it is metadata of the array it sits beside, and a separate file would create an import cycle through the barrel)

New:

- `app/db/_migrations/{Date.now()}_add_sync_infrastructure.ts`
- `app/db/_sync/registry.ts`
- `app/db/_sync/schema.ts`
- `app/db/_sync/get-changes-since.ts`
- `app/db/_sync/get-max-seq.ts`
- `app/db/_sync/get-row-by-id.ts`
- `app/db/_sync/peer-state.ts`
- `app/db/_sync/apply-upsert.ts`
- `app/db/_sync/apply-delete.ts`
- `app/db/_sync/index.ts`
- `app/db/_sync/__tests__/get-changes-since.test.ts`
- `app/db/_sync/__tests__/get-max-seq.test.ts`
- `app/db/_sync/__tests__/get-row-by-id.test.ts`
- `app/db/_sync/__tests__/peer-state.test.ts`
- `app/db/_sync/__tests__/apply-upsert.test.ts`
- `app/db/_sync/__tests__/apply-delete.test.ts`
- `app/db/_sync/__tests__/registry.test.ts`

## Migration

Idempotent, following existing migration file conventions. Creates:

```sql
CREATE TABLE IF NOT EXISTS _sync_meta (
  id TEXT PRIMARY KEY,
  value INTEGER NOT NULL
);
-- seed: INSERT OR IGNORE ('seq', 0)

CREATE TABLE IF NOT EXISTS _sync_changes (
  id TEXT PRIMARY KEY,            -- '<table_name>:<row_id>'
  table_name TEXT NOT NULL,
  row_id TEXT NOT NULL,
  seq INTEGER NOT NULL,
  deleted INTEGER NOT NULL DEFAULT 0,
  deleted_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_sync_changes_seq ON _sync_changes (seq);

CREATE TABLE IF NOT EXISTS _sync_peers (
  id TEXT PRIMARY KEY,            -- peer device id (EndpointId hex)
  last_received_seq INTEGER NOT NULL DEFAULT 0
);
```

`id` as PK on all three satisfies the infrastructure-table PK naming rule; `_`-prefix exempts them from `created_at`/`updated_at`.

Then, for each of the 11 synced tables (exact list and order in Registry below), three triggers. Template for table `npcs` (`CREATE TRIGGER IF NOT EXISTS`):

```sql
CREATE TRIGGER IF NOT EXISTS trg_sync_npcs_insert AFTER INSERT ON npcs BEGIN
  UPDATE _sync_meta SET value = value + 1 WHERE id = 'seq';
  INSERT INTO _sync_changes (id, table_name, row_id, seq, deleted, deleted_at)
    VALUES ('npcs:' || NEW.id, 'npcs', NEW.id,
            (SELECT value FROM _sync_meta WHERE id = 'seq'), 0, NULL)
    ON CONFLICT(id) DO UPDATE SET seq = excluded.seq, deleted = 0, deleted_at = NULL;
END;
```

`trg_sync_npcs_update` is identical with `AFTER UPDATE`. `trg_sync_npcs_delete` uses `AFTER DELETE`, `OLD.id`, `deleted = 1`, and `deleted_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')` (format verified byte-compatible with `toISOString()` [S_4 in .claude/knowledge/sqlite.md]) in both the VALUES and the `DO UPDATE SET` clause. Generate the 33 statements from a local array in the migration file rather than writing them out longhand — the table list is the migration's own inline constant (a migration must stay frozen; it must not import the live registry, which future migrations will extend).

## `registry.ts`

The single source of truth for what syncs and in what order:

```ts
import { imageTable } from '../image/schema';
import { adventureTable } from '../adventure/schema';
// ... one relative schema import per synced table
import type { z } from 'zod';

export type SyncedTable = {
  name: string;
  zodSchema: z.ZodType<Record<string, unknown>>;
};

// FK dependency order: parents before children. Apply upserts in this order,
// deletes in reverse. images first (SET NULL targets), adventures before all
// adventure-scoped tables, session_steps after sessions, table_config last
// (no FK relations).
export const SYNCED_TABLES: SyncedTable[] = [
  { name: 'images', zodSchema: imageTable.zodSchema },
  { name: 'adventures', zodSchema: adventureTable.zodSchema },
  { name: 'sessions', zodSchema: sessionTable.zodSchema },
  { name: 'npcs', zodSchema: npcTable.zodSchema },
  { name: 'pcs', zodSchema: pcTable.zodSchema },
  { name: 'foes', zodSchema: foeTable.zodSchema },
  { name: 'factions', zodSchema: factionTable.zodSchema },
  { name: 'locations', zodSchema: locationTable.zodSchema },
  { name: 'items', zodSchema: itemTable.zodSchema },
  { name: 'session_steps', zodSchema: sessionStepTable.zodSchema },
  { name: 'table_config', zodSchema: tableConfigTable.zodSchema },
];

export const SYNCED_TABLE_NAMES = SYNCED_TABLES.map((t) => t.name);
```

Relative schema imports (`../npc/schema`) are deliberate: exporting each `xTable` from its public barrel would widen 11 public APIs for one internal cross-table consumer — `_sync` is db-internal infrastructure, and within-layer relative imports are the established db pattern. The exact `zodSchema` member type must be verified against `db/util/schema/define-table.ts` before writing the `SyncedTable` type — adjust the type to what `defineTable` actually produces rather than forcing the sketch's `z.ZodType`.

Before finalizing the order, read each schema file not yet verified in this session (`pc`, `foe`, `faction`, `location`, `item`) and confirm their FK edges match the scaffold base schema (`adventure_id` CASCADE + `image_id` SET NULL); any deviation changes the order comment, not the mechanism.

## Accessors

All follow db-layer patterns (`getDatabase()` import, defensive validation, descriptive errors). Types for the change rows live in `schema.ts` as Zod schemas + inferred types (`SyncChangeRecord`: `{ table_name, row_id, seq, deleted, deleted_at }` — JSON-validated per the JSON-column rule when serialized into protocol messages by SF4).

- `get-changes-since.ts` — `getChangesSince(sinceSeq: number, limit: number): Promise<SyncChangeRecord[]>` — `SELECT ... FROM _sync_changes WHERE seq > $1 ORDER BY seq ASC LIMIT $2`.
- `get-max-seq.ts` — `getMaxSeq(): Promise<number>` — `SELECT value FROM _sync_meta WHERE id = 'seq'`; returns `0` when the row is missing (pre-migration defensive path).
- `get-row-by-id.ts` — `getRowById(tableName: string, rowId: string): Promise<Record<string, unknown> | null>` — rejects table names not in `SYNCED_TABLE_NAMES` with a descriptive error, then `SELECT * FROM <table> WHERE id = $1` (interpolation with the mention-search-style safety comment); `null` when absent. Used by SF4's batch builder to read outgoing rows generically.
- `peer-state.ts` — one concern (per-peer sync state): `getPeerWatermark(peerId: string): Promise<number>` (0 when absent), `setPeerWatermark(peerId: string, seq: number): Promise<void>` (`INSERT ... ON CONFLICT(id) DO UPDATE`), `removePeerState(peerId: string): Promise<void>` (DELETE).
- `apply-upsert.ts` — `applyUpsert(tableName: string, row: Record<string, unknown>, force: boolean): Promise<'applied' | 'skipped'>`. `force` is the pre-resolved timestamp tie-break: the caller (SF4) sets it to true when timestamps are equal and the sender's device id is lexicographically greater than the own device id — the db layer never sees device ids.
  1. Look up the registry entry (unknown table → `'skipped'`); `zodSchema.safeParse(row)` — failure → `'skipped'` (forward-compat posture, root KAD "Verbatim apply writers").
  2. LWW gate: `SELECT updated_at FROM <table> WHERE id = $1`. With `force` false: a local row whose `updated_at` is not strictly older than the incoming one → `'skipped'`. With `force` true: only a strictly newer local row skips.
  3. `table_config` exception (inline rationale note referencing root KAD "`table_config` merges by `table_name`"): match by `table_name` instead of id; on incoming win over a differently-id'd local row, DELETE the local row first, then insert.
  4. Build `INSERT INTO <table> (cols) VALUES (...) ON CONFLICT(id) DO UPDATE SET col = excluded.col, ...` from the validated object's keys, all values verbatim. Table name interpolation carries the mention-search-style safety comment (registry-constant values only).
  5. FK failure on execute → catch, return `'skipped'` (parent locally deleted — the deletion won; root KAD "Only directly-deleted rows get tombstones").
- `apply-delete.ts` — `applyDelete(tableName: string, rowId: string, deletedAt: string): Promise<'applied' | 'skipped'>`:
  1. LWW gate: local row present with `updated_at >= deletedAt` → `'skipped'`; local row absent → still record the tombstone (step 3) and return `'applied'` (blocks late inserts, relays onward).
  2. Row present and older: `DELETE FROM <table> WHERE id = $1` (fires the delete trigger — fresh seq, fresh local `deleted_at`).
  3. Restore origin time: bump the counter if step 2 did not run (direct `UPDATE _sync_meta`), then upsert `_sync_changes` directly with `deleted = 1, deleted_at = $deletedAt` and the current counter value (root KAD "Tombstones carry origin deletion time").

## `index.ts`

Explicit named exports: the accessor functions (`getChangesSince`, `getMaxSeq`, `getRowById`, `getPeerWatermark`, `setPeerWatermark`, `removePeerState`, `applyUpsert`, `applyDelete`), the constants `SYNCED_TABLES` and `SYNCED_TABLE_NAMES`, and `type SyncChangeRecord` from `schema.ts`. The `SyncedTable` type stays internal to `registry.ts`.

## Tests

Standard db mock scaffolding (`db/adventure/__tests__/create.test.ts` reference; `mockSelect.mockResolvedValue([])` in `beforeEach`). Required tests:

- `get-changes-since.test.ts`: (1) queries with `WHERE seq > $1 ORDER BY seq ASC LIMIT $2` and the passed values; (2) returns the mocked rows.
- `get-max-seq.test.ts`: (1) returns the counter value; (2) returns `0` when no row.
- `get-row-by-id.test.ts`: (1) unknown table name → rejects with an error message naming the table, no execute; (2) known table → `SELECT * FROM <table> WHERE id = $1` with the id; (3) empty result → `null`.
- `peer-state.test.ts`: (1) `getPeerWatermark` returns 0 when absent; (2) returns stored value; (3) `setPeerWatermark` executes an upsert containing `ON CONFLICT(id) DO UPDATE` with `[peerId, seq]`; (4) `removePeerState` executes `DELETE FROM _sync_peers` with the id.
- `apply-upsert.test.ts`: (1) unknown table name → `'skipped'`, no execute; (2) schema-invalid row → `'skipped'`; (3) local row newer → `'skipped'`; (4) local row older → executes upsert SQL containing `ON CONFLICT(id) DO UPDATE` with verbatim values (assert `updated_at` in values equals the incoming row's, not a fresh timestamp — the LWW-critical assertion); (5) no local row → insert applied; (6) `force: true` applies on equal timestamps; (7) FK failure (mockExecute rejects with a foreign-key message) → `'skipped'`, no throw; (8) `table_config` row matches by `table_name` and deletes the differently-id'd loser before inserting.
- `apply-delete.test.ts`: (1) local row newer than `deletedAt` → `'skipped'`; (2) older local row → DELETE executed, then `_sync_changes` upsert with the origin `deletedAt` value; (3) no local row → no DELETE on the domain table, counter bumped, tombstone upsert with origin `deletedAt`, returns `'applied'`.
- `registry.test.ts`: no DB mock — pure ordering invariants: (1) `images` precedes `adventures`; (2) `adventures` precedes every adventure-scoped table; (3) `sessions` precedes `session_steps`; (4) all 11 names present and unique.

## Cross-SF Wiring

`migrationHead`, the registry constants, and all five accessors have no same-SF consumers; SF3's `sync-hello` schema references the head concept only as a string field, and SF4 imports everything named here from `@db/_sync` and `@db/_migrations`.
