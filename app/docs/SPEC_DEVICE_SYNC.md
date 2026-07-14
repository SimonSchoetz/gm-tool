# Spec: Adventure Data Sync Between Paired Devices

Paired devices on the same schema/protocol version converge to identical Adventure data automatically: a full merge on connect, live propagation while connected, last-write-wins conflicts, reciprocal deletes, and image files included. Version-mismatched peers show a yellow status dot and exchange no sync data.

## Progress Tracker

- Sub-feature 1: Rust image byte commands — read/write/exists for image file transfer ([SPEC_DEVICE_SYNC_SF1.md](SPEC_DEVICE_SYNC_SF1.md))
- Sub-feature 2: DB sync infrastructure — sync tables, triggers, registry, verbatim apply, watermarks ([SPEC_DEVICE_SYNC_SF2.md](SPEC_DEVICE_SYNC_SF2.md))
- Sub-feature 3: Domain sync vocabulary — protocol message schemas, errors, constants ([SPEC_DEVICE_SYNC_SF3.md](SPEC_DEVICE_SYNC_SF3.md))
- Sub-feature 4: syncService — handshake, batch build/apply, image transfer, live push ([SPEC_DEVICE_SYNC_SF4.md](SPEC_DEVICE_SYNC_SF4.md))
- Sub-feature 5: DAL — lifecycle extension, compat cache, poller, forget cleanup ([SPEC_DEVICE_SYNC_SF5.md](SPEC_DEVICE_SYNC_SF5.md))
- Sub-feature 6: UI — StatusDot variant union, DeviceRow status derivation ([SPEC_DEVICE_SYNC_SF6.md](SPEC_DEVICE_SYNC_SF6.md))

Implementation order is SF1 → SF6. Each SF passes baseline checks when committed alone; there are no Foundation SFs. SF1 is Rust-only; SF2 and SF3 are mutually independent; SF4 depends on SF1–SF3; SF5 on SF4; SF6 on SF5.

## Key Architectural Decisions

### State-based merge, not operation replay

Devices exchange row states, not operation logs. A row carries its author-time `updated_at`; the receiver applies it iff it is strictly newer than the local state (tie → higher origin device id wins). This makes transitive N-device propagation free: an indirectly-received row *is* the newer state and re-propagates on its own merit. No vector clocks, no oplog retention. Echoes terminate because an equal-timestamp row is never applied.

### Watermarks are local sequence numbers, never timestamps

Each device keeps one monotonic change counter (`_sync_meta`). Every write to a synced table — user-initiated or sync-applied — records the row's latest change under a fresh counter value in `_sync_changes`. "What's new for peer P" = changes with `seq >` the watermark P stored for us (`_sync_peers.last_received_seq`, maintained on P). A timestamp watermark would lose indirectly-received rows whose author time predates it; the local counter cannot, because sync-applied writes bump it too.

### Change tracking lives in SQLite triggers, not application code

33 `AFTER INSERT/UPDATE/DELETE` triggers (11 synced tables × 3), installed by migration, maintain `_sync_changes` atomically with every write, covering every write path forever — including the sync apply path itself, which is what makes relayed changes re-propagate. App-level recording was rejected: ~30 call sites, non-atomic, silently incomplete on the next forgotten call site. Trigger recursion is not a concern: triggers only write `_sync_changes`/`_sync_meta`, which have no triggers of their own, and `recursive_triggers` defaults OFF anyway [S_1 in .claude/knowledge/sqlite.md].

### Only directly-deleted rows get tombstones; cascades replay locally

FK `ON DELETE CASCADE` does not fire child delete triggers [S_2 in .claude/knowledge/sqlite.md], so cascade-deleted children produce no tombstones — by design. Both devices enforce the same FK graph (sqlx enables `foreign_keys` by default, so the plugin's connections cascade [S_3 in .claude/knowledge/sqlite.md]); applying the parent's tombstone replays the cascade locally. Corollaries: (a) when building a batch, a live `_sync_changes` entry whose row no longer exists is skipped — its disappearance travels via the parent tombstone; (b) an incoming insert whose FK parent is locally absent fails the FK constraint and is skipped — the deletion won.

### Tombstones carry origin deletion time; apply restores it after the trigger fires

LWW between a deletion and an edit compares the tombstone's `deleted_at` against the row's `updated_at` (formats are byte-compatible: triggers write `strftime('%Y-%m-%dT%H:%M:%fZ','now')`, which matches `toISOString()` exactly [S_4 in .claude/knowledge/sqlite.md]). Applying a remote tombstone deletes the local row (firing the delete trigger, which stamps a fresh local `deleted_at`), then immediately overwrites `deleted_at` in `_sync_changes` with the origin value — preserving LWW truth while keeping the fresh `seq` for onward propagation. Relay through an offline window can still inflate `deleted_at` by the sync latency on devices that never had the row; accepted — the race it could misjudge is the user editing and deleting the same row on different machines within that window.

### Verbatim apply writers, never domain CRUD

`buildUpdateQuery` unconditionally overwrites `updated_at` with now [S_5: app/db/util/build-update-query.ts:23-25], which would destroy LWW convergence and echo termination. Sync apply therefore uses dedicated writers in `db/_sync/` that upsert all columns verbatim (`INSERT ... ON CONFLICT(id) DO UPDATE`, so the UPDATE trigger — not DELETE — fires on existing rows). Incoming rows are validated against the owning table's `zodSchema` before writing; rows that fail validation are skipped silently (forward-compatibility posture). Table names interpolate from the fixed registry constant only — mirroring the `mention-search.ts` precedent and its safety comment.

### `table_config` merges by `table_name`, not id

Seeded per device, the same logical config row has different ids on each machine; id-based union would duplicate every list config on first sync. Apply matches incoming `table_config` rows on `table_name`: LWW against the matched row; on incoming win, the local row is deleted and the incoming row inserted verbatim (ids converge to the winner's). No other synced table has deterministic per-device seed data.

### Compatibility key: sync protocol version + migration head

`sync-hello` carries `SYNC_PROTOCOL_VERSION` (TS const) and the migration head (last id in the static `migrations` array — deliberately not a DB read: it equals the applied head after init and avoids an import cycle through `database.ts`). Both fields equal → compatible → sync proceeds. Unequal, or no `sync-hello` within the timeout (an older client ignores unknown envelope types by the established forward-compatibility contract) → the peer is marked incompatible: yellow dot, zero sync messages. Any migration difference blocks sync by design — cross-version merging is explicitly out of scope.

### Sync messages are a separate domain module routed after device messages

The device envelope schema (`domain/devices/messages.ts`) stays untouched; sync message types live in `domain/sync/` with their own discriminated union over the same `{ v, type, payload }` wire shape. The lifecycle routes an incoming frame to `devicesService.handlePeerMessage` first; on `'ignored'`, to `syncService.handleSyncMessage`. Neither domain imports the other — the router owns the ordering.

### One batch shape for initial merge and live push

`sync-batch` (changes ordered by seq ascending, `maxSeq` of the batch) serves both the on-connect merge (response to `sync-request`) and live propagation. The receiver applies each batch transactionally and advances the peer watermark to `maxSeq` — crash-safe incremental progress, no terminal marker needed. Live propagation is a 3-second poll of the local max seq while compatible peers are connected; per-write hooks were rejected to keep sync out of every service function.

### Image files transfer as chunked base64 over the existing channel; per-id file content is immutable

`file-request` / `file-chunk` messages (256 KB chunks) ride the normal encrypted channel — a separate binary stream is new Rust protocol surface for no LAN-relevant gain. Image replacement creates a new image id (`replaceImage` composes remove + create), so a given id's file bytes never change; after applying an images-row upsert, the receiver requests the file only if `image_file_exists` says it is missing. Three small Rust commands (read bytes, write bytes, exists) are the entire Rust footprint of this feature.

### Apply concurrency is serialized; invalidation is coarse

All applies run through a module-level promise queue in `syncService` — two peers' batches never interleave their table writes. After any applied batch, the DAL invalidates all non-device queries via a predicate (`!queryKey[0].startsWith('device')`): per-table key factories are internal to their DAL modules by convention and must not be imported across modules, and coarse invalidation after a merge is behaviorally correct.

### LWW trusts wall clocks; ties break on device id

`updated_at` is author wall-clock time. For one owner on home machines, skew is seconds and only misorders edits racing across devices inside that window — accepted explicitly over hybrid logical clocks. Equal timestamps resolve deterministically per connection: the incoming row wins when the **sender's** device id is lexicographically greater than the receiver's. Rows carry no origin id (state-based design), so the sender is the only identity available; a tie relayed along different paths could theoretically resolve differently on different devices, but an equal-timestamp conflict with differing content is already a millisecond-precision coincidence — accepted.

## CLAUDE.md Impact

Includes two entries carried forward from the device-pairing feature whose impact section was not applied during its implementation (verified absent):

- `app/src-tauri/CLAUDE.md` — (carried forward) add `connectivity/` to the Structure tree and the eight connectivity commands to the command documentation; (this feature) add the three new image commands (`save_image_bytes`, `read_image_bytes`, `image_file_exists`) to the Image Commands section and `iroh`/`iroh-mdns-address-lookup`/`rand` to Dependencies.
- `app/db/CLAUDE.md` — (carried forward) add `device.ts` to the `_system/` tree entry; (this feature) add `_sync/` to the Structure tree (sync infrastructure: change tracking, watermarks, verbatim apply) and a Sync section stating: every new synced table requires trigger installation in a migration, a registry entry in `db/_sync/registry.ts` (FK-ordered), and that any migration change intentionally blocks sync against devices on a different migration head.
- `app/docs/_product/domain-scaffold.md` — add a "join the synced set" step for new domain tables: (1) add the three sync triggers in the table's creation migration, (2) add the table to `db/_sync/registry.ts` in FK dependency order, (3) note that the migration itself shifts the migration head and blocks sync with non-updated devices until both sides run the new version.
- Root `CLAUDE.md` — no update.
