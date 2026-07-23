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
      // A reply hello, sent once in response to an initial hello, so the handshake completes in both directions without looping. Optional for forward compatibility with peers that predate the field.
      isReply: z.boolean().optional(),
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
    payload: z.object({
      changes: z.array(syncChangeSchema),
      maxSeq: z.number(),
    }),
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

export const buildSyncHelloMessage = (
  migrationHead: string,
  isReply: boolean,
): SyncMessage => ({
  v: ENVELOPE_VERSION,
  type: 'sync-hello',
  payload: {
    syncProtocolVersion: SYNC_PROTOCOL_VERSION,
    migrationHead,
    isReply,
  },
});

export const buildSyncRequestMessage = (sinceSeq: number): SyncMessage => ({
  v: ENVELOPE_VERSION,
  type: 'sync-request',
  payload: { sinceSeq },
});

export const buildSyncBatchMessage = (
  changes: SyncChange[],
  maxSeq: number,
): SyncMessage => ({
  v: ENVELOPE_VERSION,
  type: 'sync-batch',
  payload: { changes, maxSeq },
});

export const buildFileRequestMessage = (
  imageId: string,
  extension: string,
): SyncMessage => ({
  v: ENVELOPE_VERSION,
  type: 'file-request',
  payload: { imageId, extension },
});

export const buildFileChunkMessage = (
  imageId: string,
  extension: string,
  seqNo: number,
  dataBase64: string,
  last: boolean,
): SyncMessage => ({
  v: ENVELOPE_VERSION,
  type: 'file-chunk',
  payload: { imageId, extension, seqNo, dataBase64, last },
});
