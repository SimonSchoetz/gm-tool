# SF3: Domain Sync Vocabulary

The `domain/sync/` module: protocol message schemas, error factories, and constants. Independent of SF1 and SF2 at compile time (the migration head is a string field here, not an import).

## Files Affected

Modified:

- `app/domain/index.ts` — append the type-block + value-block re-exports for the new module, matching the existing per-module style

New:

- `app/domain/sync/errors.ts`
- `app/domain/sync/messages.ts`
- `app/domain/sync/index.ts`
- `app/domain/sync/__tests__/messages.test.ts`

## `errors.ts`

Factory-function pattern (reference: `domain/devices/errors.ts`):

| Factory | Type name | Message prefix |
| --- | --- | --- |
| `syncHandshakeError` | `SyncHandshakeError` | `Sync handshake failed: ` |
| `syncBatchBuildError` | `SyncBatchBuildError` | `Failed to build sync batch: ` |
| `syncApplyError` | `SyncApplyError` | `Failed to apply sync batch: ` |
| `syncPushError` | `SyncPushError` | `Failed to push sync changes: ` |
| `imageTransferError` | `ImageTransferError` | `Image file transfer failed: ` |

Each takes `(cause?: unknown)` and appends `${String(cause)}`.

## `messages.ts`

Same `{ v, type, payload }` wire shape as the device envelope, own discriminated union (root KAD "Sync messages are a separate domain module"). The `v` field ties to the device envelope's version space — import `ENVELOPE_VERSION` from `../devices/messages` (a within-`domain/` relative import between sibling modules routes through the sibling's file, not `@domain`, to avoid the grouping-barrel cycle).

```ts
import { z } from 'zod';
import { ENVELOPE_VERSION } from '../devices/messages';

export const SYNC_PROTOCOL_VERSION = 1;

const syncChangeSchema = z.object({
  tableName: z.string(),
  rowId: z.string(),
  seq: z.number(),
  deleted: z.boolean(),
  deletedAt: z.string().nullable(),
  row: z.record(z.string(), z.unknown()).nullable(),
});

export type SyncChange = z.infer<typeof syncChangeSchema>;

export const syncMessageSchema = z.discriminatedUnion('type', [
  z.object({
    v: z.number(),
    type: z.literal('sync-hello'),
    payload: z.object({
      syncProtocolVersion: z.number(),
      migrationHead: z.string(),
    }),
  }),
  z.object({
    v: z.number(),
    type: z.literal('sync-request'),
    payload: z.object({ sinceSeq: z.number() }),
  }),
  z.object({
    v: z.number(),
    type: z.literal('sync-batch'),
    payload: z.object({ changes: z.array(syncChangeSchema), maxSeq: z.number() }),
  }),
  z.object({
    v: z.number(),
    type: z.literal('file-request'),
    payload: z.object({ imageId: z.string(), extension: z.string() }),
  }),
  z.object({
    v: z.number(),
    type: z.literal('file-chunk'),
    payload: z.object({
      imageId: z.string(),
      extension: z.string(),
      seqNo: z.number(),
      dataBase64: z.string(),
      last: z.boolean(),
    }),
  }),
]);

export type SyncMessage = z.infer<typeof syncMessageSchema>;
```

Builders, one per type, mirroring the device builders: `buildSyncHelloMessage(migrationHead: string)`, `buildSyncRequestMessage(sinceSeq: number)`, `buildSyncBatchMessage(changes: SyncChange[], maxSeq: number)`, `buildFileRequestMessage(imageId: string, extension: string)`, `buildFileChunkMessage(imageId: string, extension: string, seqNo: number, dataBase64: string, last: boolean)` — each returns `SyncMessage` with `v: ENVELOPE_VERSION` (and `syncProtocolVersion: SYNC_PROTOCOL_VERSION` inside the hello builder).

`tableName` is deliberately `z.string()`, not an enum of the synced tables: `domain/` must not import from `db/`, and an unknown table name is already a silent-skip in the apply layer — enum rejection here would turn forward compatibility into a parse failure.

Design note (`sync-batch` serves both merge and live push; no terminal marker): root KAD "One batch shape for initial merge and live push".

## `index.ts`

Explicit named exports: all five error factories + types, `SYNC_PROTOCOL_VERSION`, `syncMessageSchema`, `SyncMessage`, `SyncChange`, and the five builders. `domain/index.ts` re-exports the same set.

## `__tests__/messages.test.ts`

Pure Zod tests (reference: `domain/devices/__tests__/messages.test.ts`):

1. accepts each of the five built messages (`safeParse(...).success` true, one assertion per builder)
2. rejects an unknown sync message type (`{ v: 1, type: 'sync-v2-delta', payload: {} }` → `success` false — the ignore path)
3. rejects a `sync-batch` whose `changes` entry lacks `rowId`
4. accepts a `sync-batch` change with `row: null` and `deleted: true` (tombstone shape)
5. round-trips a built `sync-batch` through `JSON.parse(JSON.stringify(...))`

## Cross-SF Wiring

No same-SF consumers. SF4 imports the schema, builders, errors, and `SYNC_PROTOCOL_VERSION` via `@domain`; SF5 imports `SyncMessage` payload types indirectly through SF4's service API only (the lifecycle never parses sync messages itself).
