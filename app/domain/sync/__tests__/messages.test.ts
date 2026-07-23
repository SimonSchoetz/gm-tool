import { describe, it, expect } from 'vitest';
import {
  syncMessageSchema,
  buildSyncHelloMessage,
  buildSyncRequestMessage,
  buildSyncBatchMessage,
  buildFileRequestMessage,
  buildFileChunkMessage,
} from '../messages';

describe('syncMessageSchema', () => {
  it('accepts a built initial sync-hello message', () => {
    const result = syncMessageSchema.safeParse(
      buildSyncHelloMessage('1784365870026', false),
    );
    expect(result.success).toBe(true);
  });

  it('accepts a built reply sync-hello message', () => {
    const result = syncMessageSchema.safeParse(
      buildSyncHelloMessage('1784365870026', true),
    );
    expect(result.success).toBe(true);
  });

  it('accepts a sync-hello without isReply (forward compatibility)', () => {
    const result = syncMessageSchema.safeParse({
      v: 1,
      type: 'sync-hello',
      payload: { syncProtocolVersion: 1, migrationHead: '1784365870026' },
    });
    expect(result.success).toBe(true);
  });

  it('accepts a built sync-request message', () => {
    const result = syncMessageSchema.safeParse(buildSyncRequestMessage(0));
    expect(result.success).toBe(true);
  });

  it('accepts a built sync-batch message', () => {
    const result = syncMessageSchema.safeParse(
      buildSyncBatchMessage(
        [
          {
            tableName: 'npcs',
            rowId: 'npc-1',
            seq: 1,
            deleted: false,
            deletedAt: null,
            row: { id: 'npc-1', name: 'Goblin' },
          },
        ],
        1,
      ),
    );
    expect(result.success).toBe(true);
  });

  it('accepts a built file-request message', () => {
    const result = syncMessageSchema.safeParse(
      buildFileRequestMessage('img-1', 'png'),
    );
    expect(result.success).toBe(true);
  });

  it('accepts a built file-chunk message', () => {
    const result = syncMessageSchema.safeParse(
      buildFileChunkMessage('img-1', 'png', 0, 'base64data', true),
    );
    expect(result.success).toBe(true);
  });

  it('rejects an unknown sync message type', () => {
    const result = syncMessageSchema.safeParse({
      v: 1,
      type: 'sync-v2-delta',
      payload: {},
    });
    expect(result.success).toBe(false);
  });

  it('rejects a sync-batch whose change entry lacks rowId', () => {
    const result = syncMessageSchema.safeParse({
      v: 1,
      type: 'sync-batch',
      payload: {
        changes: [
          {
            tableName: 'npcs',
            seq: 1,
            deleted: false,
            deletedAt: null,
            row: null,
          },
        ],
        maxSeq: 1,
      },
    });
    expect(result.success).toBe(false);
  });

  it('accepts a sync-batch tombstone change with row: null and deleted: true', () => {
    const result = syncMessageSchema.safeParse(
      buildSyncBatchMessage(
        [
          {
            tableName: 'npcs',
            rowId: 'npc-1',
            seq: 2,
            deleted: true,
            deletedAt: '2024-01-01T00:00:00.000Z',
            row: null,
          },
        ],
        2,
      ),
    );
    expect(result.success).toBe(true);
  });

  it('round-trips a built sync-batch through JSON', () => {
    const result = syncMessageSchema.safeParse(
      JSON.parse(
        JSON.stringify(
          buildSyncBatchMessage(
            [
              {
                tableName: 'npcs',
                rowId: 'npc-1',
                seq: 1,
                deleted: false,
                deletedAt: null,
                row: { id: 'npc-1', name: 'Goblin' },
              },
            ],
            1,
          ),
        ),
      ),
    );
    expect(result.success).toBe(true);
  });
});
