import { invoke } from '@tauri-apps/api/core';
import { getDevice } from '@db/_system';
import * as syncDb from '@db/_sync';
import { migrationHead } from '@db/_migrations';
import {
  SYNC_PROTOCOL_VERSION,
  syncMessageSchema,
  buildSyncHelloMessage,
  buildSyncRequestMessage,
  buildSyncBatchMessage,
  buildFileRequestMessage,
  buildFileChunkMessage,
  syncHandshakeError,
  syncApplyError,
  syncPushError,
  type SyncChange,
} from '@domain';

export type SyncMessageOutcome =
  | { kind: 'ignored' }
  | { kind: 'compat'; compat: 'compatible' | 'incompatible' }
  | { kind: 'applied' }
  | { kind: 'none' };

const BATCH_LIMIT = 200;
const FILE_CHUNK_SOURCE_BYTES = 256 * 1024;
// 4-char-aligned so every chunk (except possibly the last) is an independently
// decodable base64 substring representing exactly N source bytes.
const CHARS_PER_FILE_CHUNK = Math.floor(FILE_CHUNK_SOURCE_BYTES / 3) * 4;

let applyQueue: Promise<void> = Promise.resolve();
const lastPushedSeq = new Map<string, number>();
const incomingFiles = new Map<
  string,
  { extension: string; chunks: string[] }
>();

const runExclusive = <T>(fn: () => Promise<T>): Promise<T> => {
  const result = applyQueue.then(fn);
  applyQueue = result.then(
    () => undefined,
    () => undefined,
  );
  return result;
};

export const sendSyncHello = async (endpointId: string): Promise<void> => {
  try {
    await invoke('send_message', {
      endpointId,
      envelope: JSON.stringify(buildSyncHelloMessage(migrationHead, false)),
    });
  } catch (cause) {
    throw syncHandshakeError(cause);
  }
};

const chunkBase64 = (base64: string): string[] => {
  const chunks: string[] = [];
  for (let i = 0; i < base64.length; i += CHARS_PER_FILE_CHUNK) {
    chunks.push(base64.slice(i, i + CHARS_PER_FILE_CHUNK));
  }
  return chunks.length > 0 ? chunks : [''];
};

const handleSyncHello = async (
  endpointId: string,
  payload: {
    syncProtocolVersion: number;
    migrationHead: string;
    isReply?: boolean | undefined;
  },
): Promise<SyncMessageOutcome> => {
  const compat: 'compatible' | 'incompatible' =
    payload.syncProtocolVersion === SYNC_PROTOCOL_VERSION &&
    payload.migrationHead === migrationHead
      ? 'compatible'
      : 'incompatible';

  if (compat === 'compatible') {
    try {
      const sinceSeq = await syncDb.getPeerWatermark(endpointId);
      await invoke('send_message', {
        endpointId,
        envelope: JSON.stringify(buildSyncRequestMessage(sinceSeq)),
      });
      // Reciprocate an initial hello with our own so the peer sends us a sync-request too. Without this, a hello lost to the connection-dedup race (our peerConnected can fire on the connection that dedup then closes) leaves that direction with no seeded push cursor — one-directional sync. isReply is the one-shot guard that stops the reply from bouncing forever.
      if (!payload.isReply) {
        await invoke('send_message', {
          endpointId,
          envelope: JSON.stringify(buildSyncHelloMessage(migrationHead, true)),
        });
      }
    } catch {
      // Best-effort, mirrors sendHello — a dropped request is recovered by
      // the peer's own hello-triggered request on the next connect.
    }
  }

  return { kind: 'compat', compat };
};

const pushBatchesTo = async (endpointId: string): Promise<void> => {
  let cursor = lastPushedSeq.get(endpointId) ?? 0;
  let hasMore = true;

  while (hasMore) {
    const changes = await syncDb.getChangesSince(cursor, BATCH_LIMIT);
    if (changes.length === 0) return;

    const syncChanges: SyncChange[] = [];
    for (const change of changes) {
      if (change.deleted) {
        syncChanges.push({
          tableName: change.table_name,
          rowId: change.row_id,
          seq: change.seq,
          deleted: true,
          deletedAt: change.deleted_at,
          row: null,
        });
        continue;
      }

      // A null row means the row is gone — cascade-deleted; its disappearance
      // travels with the parent tombstone, so it is skipped entirely here.
      const row = await syncDb.getRowById(change.table_name, change.row_id);
      if (row === null) continue;
      syncChanges.push({
        tableName: change.table_name,
        rowId: change.row_id,
        seq: change.seq,
        deleted: false,
        deletedAt: null,
        row,
      });
    }

    const maxSeqInBatch = changes[changes.length - 1].seq;
    try {
      await invoke('send_message', {
        endpointId,
        envelope: JSON.stringify(
          buildSyncBatchMessage(syncChanges, maxSeqInBatch),
        ),
      });
    } catch {
      return; // Peer dropped mid-push — reconnect re-pulls.
    }

    cursor = maxSeqInBatch;
    lastPushedSeq.set(endpointId, cursor);
    hasMore = changes.length === BATCH_LIMIT;
  }
};

const applyBatch = async (
  endpointId: string,
  payload: { changes: SyncChange[]; maxSeq: number },
): Promise<void> => {
  const ownDevice = await getDevice();
  // Timestamp ties only occur when local and incoming updated_at are equal;
  // for any non-equal pair force is a no-op, so it is safe to compute once
  // per batch from device ids alone rather than pre-reading every local row.
  const force = endpointId > (ownDevice?.id ?? '');

  const upsertsByTable = new Map<string, SyncChange[]>();
  const deletesByTable = new Map<string, SyncChange[]>();
  for (const change of payload.changes) {
    const byTable = change.deleted ? deletesByTable : upsertsByTable;
    const list = byTable.get(change.tableName) ?? [];
    list.push(change);
    byTable.set(change.tableName, list);
  }

  const appliedImageChanges: SyncChange[] = [];

  // No wrapping BEGIN/COMMIT: tauri-plugin-sql runs each statement on an arbitrary pooled connection and never tracks a raw transaction, so an orphaned BEGIN holds a write lock that starves every other writer with SQLITE_BUSY ("database is locked").
  // The module-level applyQueue serializes whole batches and every applyUpsert/applyDelete is idempotent under LWW, so a mid-batch crash is recovered when the peer re-sends from the unadvanced watermark on reconnect.
  try {
    for (const table of syncDb.SYNCED_TABLES) {
      const tableChanges = (upsertsByTable.get(table.name) ?? []).sort(
        (a, b) => a.seq - b.seq,
      );
      for (const change of tableChanges) {
        if (change.row === null) continue; // Malformed: a live change needs a row.
        const result = await syncDb.applyUpsert(table.name, change.row, force);
        if (result === 'applied' && table.name === 'images') {
          appliedImageChanges.push(change);
        }
      }
    }

    for (const table of [...syncDb.SYNCED_TABLES].reverse()) {
      const tableChanges = (deletesByTable.get(table.name) ?? []).sort(
        (a, b) => a.seq - b.seq,
      );
      for (const change of tableChanges) {
        if (change.deletedAt === null) continue; // Malformed tombstone.
        await syncDb.applyDelete(table.name, change.rowId, change.deletedAt);
      }
    }

    await syncDb.setPeerWatermark(endpointId, payload.maxSeq);
  } catch (cause) {
    throw syncApplyError(cause);
  }

  for (const change of appliedImageChanges) {
    const extension = change.row?.file_extension;
    if (typeof extension !== 'string') continue;
    try {
      const exists = await invoke<boolean>('image_file_exists', {
        id: change.rowId,
        extension,
      });
      if (!exists) {
        await invoke('send_message', {
          endpointId,
          envelope: JSON.stringify(
            buildFileRequestMessage(change.rowId, extension),
          ),
        });
      }
    } catch {
      // Best-effort — a missed file request is recovered on the next sync.
    }
  }
};

const handleFileRequest = async (
  endpointId: string,
  payload: { imageId: string; extension: string },
): Promise<void> => {
  let base64: string;
  try {
    base64 = await invoke<string>('read_image_bytes', {
      id: payload.imageId,
      extension: payload.extension,
    });
  } catch {
    return; // File genuinely absent — drop the request silently.
  }

  const chunks = chunkBase64(base64);
  for (let i = 0; i < chunks.length; i++) {
    try {
      await invoke('send_message', {
        endpointId,
        envelope: JSON.stringify(
          buildFileChunkMessage(
            payload.imageId,
            payload.extension,
            i,
            chunks[i],
            i === chunks.length - 1,
          ),
        ),
      });
    } catch {
      return; // Peer dropped mid-transfer.
    }
  }
};

const handleFileChunk = async (payload: {
  imageId: string;
  extension: string;
  seqNo: number;
  dataBase64: string;
  last: boolean;
}): Promise<void> => {
  const existing = incomingFiles.get(payload.imageId) ?? {
    extension: payload.extension,
    chunks: [],
  };
  existing.chunks.push(payload.dataBase64);
  incomingFiles.set(payload.imageId, existing);

  if (!payload.last) return;

  incomingFiles.delete(payload.imageId);
  try {
    await invoke('save_image_bytes', {
      id: payload.imageId,
      extension: existing.extension,
      dataBase64: existing.chunks.join(''),
    });
  } catch {
    // Best-effort — a failed write is recovered by a future file-request.
  }
};

export const handleSyncMessage = async (
  endpointId: string,
  rawEnvelope: string,
): Promise<SyncMessageOutcome> => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawEnvelope);
  } catch {
    return { kind: 'ignored' };
  }
  const result = syncMessageSchema.safeParse(parsed);
  if (!result.success) return { kind: 'ignored' };

  const message = result.data;
  switch (message.type) {
    case 'sync-hello':
      return handleSyncHello(endpointId, message.payload);
    case 'sync-request':
      lastPushedSeq.set(endpointId, message.payload.sinceSeq);
      void runExclusive(() => pushBatchesTo(endpointId)).catch(() => {
        // Best-effort — the peer's next poll or reconnect retries.
      });
      // A peer only sends sync-request after judging us compatible, and that check is equality on both SYNC_PROTOCOL_VERSION and migrationHead — so it holds symmetrically and confirms compatibility without waiting for their sync-hello.
      // This is what restores compat after a reload: the peer's connection never dropped, so it never re-sends sync-hello, and only its reply to our bootstrap hello can settle our own compat state.
      return { kind: 'compat', compat: 'compatible' };
    case 'sync-batch':
      await runExclusive(() => applyBatch(endpointId, message.payload));
      return { kind: 'applied' };
    case 'file-request':
      await handleFileRequest(endpointId, message.payload);
      return { kind: 'none' };
    case 'file-chunk':
      await handleFileChunk(message.payload);
      return { kind: 'none' };
  }
};

export const pushNewChanges = async (): Promise<void> => {
  try {
    const maxSeq = await syncDb.getMaxSeq();
    // Iterate lastPushedSeq rather than a caller-supplied peer list: an entry is seeded only by an incoming sync-request, which a peer sends only after judging us compatible — so its keys are exactly the connected-and-compatible push targets, and its values are the caught-up cursors. This keeps the poller off the device query cache, whose connected/compat entries are undefined whenever no device screen is mounted (the reason live pushes silently no-op'd during entity editing).
    for (const [peerId, pushed] of lastPushedSeq) {
      if (pushed >= maxSeq) continue;
      void runExclusive(() => pushBatchesTo(peerId)).catch(() => {
        // Best-effort — the next poll tick retries.
      });
    }
  } catch (cause) {
    throw syncPushError(cause);
  }
};

export const resetPeerSession = (endpointId: string): void => {
  lastPushedSeq.delete(endpointId);
  // incomingFiles is keyed by imageId, not by peer, so a disconnect cannot
  // attribute buffers to a specific sender — clear all of them rather than
  // risk stale chunks from this peer corrupting a future reassembly.
  incomingFiles.clear();
};
