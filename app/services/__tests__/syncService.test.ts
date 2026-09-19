import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  buildFileRequestMessage,
  buildSyncBatchMessage,
  type SyncChange,
} from '@domain';
import type * as syncDb from '@db/_sync';
import type * as systemDb from '@db/_system';

const getDevice = vi.hoisted(() => vi.fn<typeof systemDb.getDevice>());
const applyUpsert = vi.hoisted(() => vi.fn<typeof syncDb.applyUpsert>());
const applyDelete = vi.hoisted(() => vi.fn<typeof syncDb.applyDelete>());
const setPeerWatermark = vi.hoisted(() =>
  vi.fn<typeof syncDb.setPeerWatermark>(),
);
const invoke = vi.hoisted(() =>
  vi.fn<
    (command: string, args?: Record<string, unknown>) => Promise<unknown>
  >(),
);

vi.mock('@db/_system', () => ({ getDevice }));
vi.mock('@db/_sync', () => ({
  SYNCED_TABLES: [
    { name: 'images' },
    { name: 'adventures' },
    { name: 'sessions' },
  ],
  applyUpsert,
  applyDelete,
  setPeerWatermark,
}));
vi.mock('@db/_migrations', () => ({ migrationHead: 'head' }));
vi.mock('@tauri-apps/api/core', () => ({ invoke }));

const OWN_DEVICE_ID = 'm';
const PEER_ID = 'peer';
const UPDATED_AT = '2026-01-01T00:00:00.000Z';
const DELETED_AT = '2026-03-01T00:00:00.000Z';

const answerCommand = (command: string): Promise<unknown> => {
  switch (command) {
    case 'image_file_exists':
      return Promise.resolve(true);
    case 'send_message':
      return Promise.resolve(undefined);
    default:
      return Promise.reject(new Error(`Unexpected command: ${command}`));
  }
};

const upsert = (
  tableName: string,
  rowId: string,
  seq: number,
  columns: Record<string, unknown> = {},
): SyncChange => ({
  tableName,
  rowId,
  seq,
  deleted: false,
  deletedAt: null,
  row: { id: rowId, updated_at: UPDATED_AT, ...columns },
});

const tombstone = (
  tableName: string,
  rowId: string,
  seq: number,
): SyncChange => ({
  tableName,
  rowId,
  seq,
  deleted: true,
  deletedAt: DELETED_AT,
  row: null,
});

const rawBatch = (changes: SyncChange[], maxSeq: number): string =>
  JSON.stringify(buildSyncBatchMessage(changes, maxSeq));

const imageFileChecks = () =>
  invoke.mock.calls.filter(([command]) => command === 'image_file_exists');

const sentMessages = () =>
  invoke.mock.calls
    .filter(([command]) => command === 'send_message')
    .map(([, args]) => ({
      endpointId: args?.endpointId,
      message: JSON.parse(String(args?.envelope)) as unknown,
    }));

describe('handleSyncMessage with a sync-batch message', () => {
  beforeEach(() => {
    vi.resetModules();
    getDevice.mockResolvedValue({ id: OWN_DEVICE_ID, name: null });
    applyUpsert.mockResolvedValue('applied');
    applyDelete.mockResolvedValue('applied');
    setPeerWatermark.mockResolvedValue(undefined);
    invoke.mockImplementation(answerCommand);
  });

  it('rejects with SyncApplyError and applies nothing when the own device cannot be read', async () => {
    const { handleSyncMessage } = await import('../syncService');
    getDevice.mockRejectedValue(new Error('device store unreadable'));
    const changes = [
      upsert('adventures', 'adventure-a', 1),
      tombstone('adventures', 'adventure-b', 2),
    ];

    await expect(
      handleSyncMessage(PEER_ID, rawBatch(changes, 2)),
    ).rejects.toMatchObject({ name: 'SyncApplyError' });

    expect(applyUpsert).not.toHaveBeenCalled();
    expect(applyDelete).not.toHaveBeenCalled();
    expect(setPeerWatermark).not.toHaveBeenCalled();
  });

  it('rejects with SyncApplyError and leaves the watermark alone when the second upsert fails', async () => {
    const { handleSyncMessage } = await import('../syncService');
    applyUpsert.mockImplementation((_table, row) =>
      row.id === 'adventure-b'
        ? Promise.reject(new Error('foreign key failed'))
        : Promise.resolve('applied'),
    );
    const changes = [
      upsert('adventures', 'adventure-a', 1),
      upsert('adventures', 'adventure-b', 2),
    ];

    await expect(
      handleSyncMessage(PEER_ID, rawBatch(changes, 2)),
    ).rejects.toMatchObject({ name: 'SyncApplyError' });

    expect(applyUpsert.mock.calls.map(([, row]) => row.id)).toEqual([
      'adventure-a',
      'adventure-b',
    ]);
    expect(setPeerWatermark).not.toHaveBeenCalled();
  });

  it('applies upserts parents first and deletes children first, each in ascending seq, and sets the watermark last', async () => {
    const { handleSyncMessage } = await import('../syncService');
    const calls: string[] = [];
    applyUpsert.mockImplementation((table, row) => {
      calls.push(`upsert ${table}:${String(row.id)}`);
      return Promise.resolve('applied');
    });
    applyDelete.mockImplementation((table, rowId) => {
      calls.push(`delete ${table}:${rowId}`);
      return Promise.resolve('applied');
    });
    setPeerWatermark.mockImplementation((peerId, seq) => {
      calls.push(`watermark ${peerId}:${String(seq)}`);
      return Promise.resolve();
    });
    // Table order and row order in the input differ from the expected apply order, so an implementation that skips the registry order or the seq sort gives a different log.
    const shuffledChanges = [
      upsert('adventures', 'adventure-a', 7),
      tombstone('adventures', 'adventure-x', 4),
      upsert('sessions', 'session-a', 9),
      tombstone('images', 'image-x', 12),
      upsert('sessions', 'session-b', 3),
      upsert('images', 'image-a', 5),
      tombstone('sessions', 'session-x', 8),
      tombstone('images', 'image-y', 6),
    ];
    const expectedApplyOrder = [
      'upsert images:image-a',
      'upsert adventures:adventure-a',
      'upsert sessions:session-b',
      'upsert sessions:session-a',
      'delete sessions:session-x',
      'delete adventures:adventure-x',
      'delete images:image-y',
      'delete images:image-x',
      `watermark ${PEER_ID}:15`,
    ];

    await handleSyncMessage(PEER_ID, rawBatch(shuffledChanges, 15));

    expect(calls).toEqual(expectedApplyOrder);
  });

  it.each([
    ['z', true],
    ['a', false],
  ] as const)(
    `with peer id %s against this device id ${OWN_DEVICE_ID}, applyUpsert gets force %s`,
    async (endpointId, force) => {
      const { handleSyncMessage } = await import('../syncService');
      const change = upsert('adventures', 'adventure-a', 1);

      await handleSyncMessage(endpointId, rawBatch([change], 1));

      expect(applyUpsert).toHaveBeenCalledWith('adventures', change.row, force);
    },
  );

  it('skips a live change without a row and a tombstone without a deletion time, and still applies the valid changes', async () => {
    const { handleSyncMessage } = await import('../syncService');
    const valid = upsert('adventures', 'adventure-ok', 2);
    const changes: SyncChange[] = [
      {
        tableName: 'adventures',
        rowId: 'adventure-without-row',
        seq: 1,
        deleted: false,
        deletedAt: null,
        row: null,
      },
      valid,
      {
        tableName: 'adventures',
        rowId: 'adventure-without-time',
        seq: 3,
        deleted: true,
        deletedAt: null,
        row: null,
      },
      tombstone('adventures', 'adventure-gone', 4),
    ];

    await handleSyncMessage(PEER_ID, rawBatch(changes, 9));

    expect(applyUpsert).toHaveBeenCalledTimes(1);
    expect(applyUpsert).toHaveBeenCalledWith(
      'adventures',
      valid.row,
      expect.any(Boolean),
    );
    expect(applyDelete.mock.calls).toEqual([
      ['adventures', 'adventure-gone', DELETED_AT],
    ]);
    expect(setPeerWatermark).toHaveBeenCalledWith(PEER_ID, 9);
  });

  it('requests only the file of an image that was applied and is missing on disk', async () => {
    const { handleSyncMessage } = await import('../syncService');
    applyUpsert.mockImplementation((_table, row) =>
      row.id === 'image-c'
        ? Promise.resolve('skipped')
        : Promise.resolve('applied'),
    );
    invoke.mockImplementation((command, args) =>
      command === 'image_file_exists'
        ? Promise.resolve(args?.id === 'image-b')
        : answerCommand(command),
    );
    const changes = [
      upsert('images', 'image-a', 1, { file_extension: 'png' }),
      upsert('images', 'image-b', 2, { file_extension: 'png' }),
      upsert('images', 'image-c', 3, { file_extension: 'png' }),
    ];

    await handleSyncMessage(PEER_ID, rawBatch(changes, 3));

    expect(imageFileChecks()).toEqual([
      ['image_file_exists', { id: 'image-a', extension: 'png' }],
      ['image_file_exists', { id: 'image-b', extension: 'png' }],
    ]);
    expect(sentMessages()).toEqual([
      {
        endpointId: PEER_ID,
        message: buildFileRequestMessage('image-a', 'png'),
      },
    ]);
  });

  it('still resolves as applied and keeps the watermark when a file request fails', async () => {
    const { handleSyncMessage } = await import('../syncService');
    invoke.mockImplementation((command, args) =>
      command === 'image_file_exists' && args?.id === 'image-b'
        ? Promise.resolve(false)
        : Promise.reject(new Error('peer unreachable')),
    );
    const changes = [
      upsert('images', 'image-a', 1, { file_extension: 'png' }),
      upsert('images', 'image-b', 2, { file_extension: 'png' }),
    ];

    await expect(
      handleSyncMessage(PEER_ID, rawBatch(changes, 5)),
    ).resolves.toEqual({ kind: 'applied' });

    expect(setPeerWatermark).toHaveBeenCalledWith(PEER_ID, 5);
    expect(imageFileChecks()).toEqual([
      ['image_file_exists', { id: 'image-a', extension: 'png' }],
      ['image_file_exists', { id: 'image-b', extension: 'png' }],
    ]);
    expect(sentMessages()).toHaveLength(1);
  });
});
