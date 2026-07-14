# SF4: syncService

The sync engine: handshake evaluation, batch building and application, watermark management, image file transfer, and live push. One service file per the one-file-per-domain convention. Depends on SF1 (Rust commands), SF2 (`@db/_sync`, `@db/_migrations`), SF3 (`@domain`).

## Files Affected

Modified:

- `app/services/devicesService.ts` — two point changes: (1) `forgetDevice` additionally calls `syncDb.removePeerState(endpointId)` after the paired-device row removal; (2) `handlePeerMessage`'s `unpair` branch does the same. Import `* as syncDb from '@db/_sync'`. (Sync-state cleanup belongs to the forget flow that owns the peer's lifecycle — inline rationale note at both sites referencing root KAD "Watermarks are local sequence numbers".)

New:

- `app/services/syncService.ts`

## Module-Level State

Three module-scoped values (session-local, never persisted):

- `applyQueue: Promise<void>` — promise-chain serializer; every apply and every batch-build appends via a `runExclusive(fn)` helper local to the file. All incoming `sync-request`/`sync-batch` handling and all outgoing pushes run through it (root KAD "Apply concurrency is serialized").
- `lastPushedSeq: Map<string, number>` — per-peer highest own seq already pushed this session; seeded from the peer's `sync-request.sinceSeq` when it arrives, reset on disconnect (SF5 calls `resetPeerSession`).
- `incomingFiles: Map<string, { extension: string; chunks: string[] }>` — file-chunk assembly buffers keyed by imageId.

## Exported Functions

All wrap in try/catch throwing the SF3 domain errors; all `async`.

**`sendSyncHello(endpointId: string): Promise<void>`** — throws `syncHandshakeError`. Sends `buildSyncHelloMessage(migrationHead)` (with `migrationHead` imported from `@db/_migrations`) via `invoke('send_message', ...)`. SF5 calls it on peer-connect alongside the existing device hello.

Compat evaluation is internal to `handleSyncMessage`: an incoming `sync-hello` is compatible iff its `syncProtocolVersion` equals `SYNC_PROTOCOL_VERSION` and its `migrationHead` equals the local head (root KAD "Compatibility key").

**`handleSyncMessage(endpointId: string, rawEnvelope: string): Promise<SyncMessageOutcome>`** with

```ts
export type SyncMessageOutcome =
  | { kind: 'ignored' }
  | { kind: 'compat'; compat: 'compatible' | 'incompatible' }
  | { kind: 'applied' }
  | { kind: 'none' };
```

Routing (called by SF5 only after `devicesService.handlePeerMessage` returned `'ignored'`): `JSON.parse` + `syncMessageSchema.safeParse`; failure → `{ kind: 'ignored' }`. Then by type:

- `sync-hello` → evaluate; when compatible, immediately send our `sync-request` (watermark from `syncDb.getPeerWatermark(endpointId)`) so both directions start pulling; return `{ kind: 'compat', compat }`. SF5 stores the compat value; it must not re-trigger requests itself.
- `sync-request` → `void` a queued push of everything past `payload.sinceSeq` to this peer (see Batch Building); seed `lastPushedSeq`; return `{ kind: 'none' }`.
- `sync-batch` → queued apply (see Batch Application); return `{ kind: 'applied' }` (SF5 invalidates on this outcome).
- `file-request` → `invoke read_image_bytes`; on `Err`, drop silently (file genuinely absent); chunk the base64 string into 256 KB-of-source-bytes segments and send sequential `file-chunk` messages; return `{ kind: 'none' }`.
- `file-chunk` → append to the assembly buffer; on `last`, concatenate, `invoke save_image_bytes`, clear the buffer; return `{ kind: 'none' }`.

**`pushNewChanges(peerIds: string[]): Promise<void>`** — the poller entry (SF5 calls every 3 s): `getMaxSeq()`; for each peer whose `lastPushedSeq` is below it, queue a batch send from that seq. Peers with no `lastPushedSeq` entry are skipped — they have not completed a handshake-triggered `sync-request` this session, and pushing ahead of their pull would advance nothing (their watermark update is what makes progress durable).

**`resetPeerSession(endpointId: string): void`** — drops the peer's `lastPushedSeq` entry and any half-assembled file buffers from that peer. SF5 calls it on peer-disconnect.

## Batch Building (internal)

From `sinceSeq` for one peer, inside the queue, looping until caught up:

1. `syncDb.getChangesSince(cursor, 200)`.
2. For each change record: `deleted` → emit `{ tableName, rowId, seq, deleted: true, deletedAt, row: null }`. Live → `syncDb.getRowById(tableName, rowId)`; a `null` result is skipped entirely (cascade-deleted — its disappearance travels with the parent tombstone; root KAD "Only directly-deleted rows get tombstones").
3. Send `buildSyncBatchMessage(changes, highestSeqInBatch)` via `invoke('send_message', ...)`; a send failure aborts the loop silently (peer dropped — reconnect re-pulls).
4. Update `lastPushedSeq` after each successful send; continue until `getChangesSince` returns fewer than the limit.

## Batch Application (internal)

Inside the queue, per received `sync-batch`:

1. Partition changes into upserts and deletes.
2. `BEGIN` (manual transaction, migration-runner precedent).
3. Upserts grouped by table, tables in `SYNCED_TABLES` order; within a table, ascending seq. For each: resolve the tie-break (`force` = incoming `updated_at` equals local AND sender device id > own device id — own id from `getDevice()` once per batch) and call `applyUpsert`.
4. Deletes grouped by table in reverse `SYNCED_TABLES` order: `applyDelete(tableName, rowId, deletedAt)` — a tombstone change with `deletedAt: null` is skipped (malformed).
5. `setPeerWatermark(endpointId, payload.maxSeq)`.
6. `COMMIT`; on any thrown error `ROLLBACK` and rethrow as `syncApplyError` (per-row skips are not errors; only infrastructure failures roll back).
7. After commit: for every applied `images` upsert, `invoke image_file_exists`; when missing, send `file-request` with the row's `file_extension`. (`file_size`/frame fields synced verbatim in the row; file bytes per id are immutable — root KAD "Image files transfer as chunked base64".)

## Cross-SF Wiring

`sendSyncHello`, `handleSyncMessage`, `pushNewChanges`, `resetPeerSession`, and `SyncMessageOutcome` are consumed by SF5's lifecycle extension. The `devicesService` edits have their consumers already live (forget flow, unpair handling). No service test files — the services layer carries no test convention in this repo.
