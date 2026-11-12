import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  SYNC_PROTOCOL_VERSION,
  buildFileChunkMessage,
  buildFileRequestMessage,
  buildSyncBatchMessage,
  buildSyncHelloMessage,
  buildSyncRequestMessage,
  type SyncChange,
} from '@domain';
import type * as syncDb from '@db/_sync';
import { BATCH_LIMIT } from '../syncService';
import type * as systemDb from '@db/_system';

const getDevice = vi.hoisted(() => vi.fn<typeof systemDb.getDevice>());
const applyUpsert = vi.hoisted(() => vi.fn<typeof syncDb.applyUpsert>());
const applyDelete = vi.hoisted(() => vi.fn<typeof syncDb.applyDelete>());
const setPeerWatermark = vi.hoisted(() =>
  vi.fn<typeof syncDb.setPeerWatermark>(),
);
const getPeerWatermark = vi.hoisted(() =>
  vi.fn<typeof syncDb.getPeerWatermark>(),
);
const getChangesSince = vi.hoisted(() =>
  vi.fn<typeof syncDb.getChangesSince>(),
);
const getLiveChangesSince = vi.hoisted(() =>
  vi.fn<typeof syncDb.getLiveChangesSince>(),
);
const getRowById = vi.hoisted(() => vi.fn<typeof syncDb.getRowById>());
const getMaxSeq = vi.hoisted(() => vi.fn<typeof syncDb.getMaxSeq>());
const invoke = vi.hoisted(() =>
  vi.fn<
    (command: string, args?: Record<string, unknown>) => Promise<unknown>
  >(),
);

vi.mock('@db/_system', () => ({ getDevice }));
vi.mock('@db/_sync', () => ({
  SYNCED_TABLES: [
    { name: 'images', parents: [] },
    { name: 'adventures', parents: [{ column: 'image_id', table: 'images' }] },
    {
      name: 'sessions',
      parents: [{ column: 'adventure_id', table: 'adventures' }],
    },
  ],
  applyUpsert,
  applyDelete,
  setPeerWatermark,
  getPeerWatermark,
  getChangesSince,
  getLiveChangesSince,
  getRowById,
  getMaxSeq,
}));
vi.mock('@db/_migrations', () => ({ migrationHead: 'head' }));
vi.mock('@tauri-apps/api/core', () => ({ invoke }));

const OWN_DEVICE_ID = 'm';
const PEER_ID = 'peer';
const UPDATED_AT = '2026-01-01T00:00:00.000Z';
const DELETED_AT = '2026-03-01T00:00:00.000Z';

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
  invoke.mock.calls.filter(
    ([command]) => command === 'check_image_file_exists',
  );

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
    invoke.mockResolvedValue(undefined);
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
      command === 'check_image_file_exists'
        ? Promise.resolve(args?.id === 'image-b')
        : Promise.resolve(undefined),
    );
    const changes = [
      upsert('images', 'image-a', 1, { file_extension: 'png' }),
      upsert('images', 'image-b', 2, { file_extension: 'png' }),
      upsert('images', 'image-c', 3, { file_extension: 'png' }),
    ];

    await handleSyncMessage(PEER_ID, rawBatch(changes, 3));

    expect(imageFileChecks()).toEqual([
      ['check_image_file_exists', { id: 'image-a', extension: 'png' }],
      ['check_image_file_exists', { id: 'image-b', extension: 'png' }],
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
      command === 'check_image_file_exists' && args?.id === 'image-b'
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
      ['check_image_file_exists', { id: 'image-a', extension: 'png' }],
      ['check_image_file_exists', { id: 'image-b', extension: 'png' }],
    ]);
    expect(sentMessages()).toHaveLength(1);
  });

  it('passes force true for any peer id when this device has no stored identity', async () => {
    const { handleSyncMessage } = await import('../syncService');
    getDevice.mockResolvedValue(null);
    const change = upsert('adventures', 'adventure-a', 1);

    await handleSyncMessage(PEER_ID, rawBatch([change], 1));

    expect(applyUpsert).toHaveBeenCalledWith('adventures', change.row, true);
  });

  it('requests no file for an applied image row whose file_extension is missing or not a string', async () => {
    const { handleSyncMessage } = await import('../syncService');
    const changes = [
      upsert('images', 'image-a', 1),
      upsert('images', 'image-b', 2, { file_extension: 42 }),
    ];

    await handleSyncMessage(PEER_ID, rawBatch(changes, 2));

    expect(imageFileChecks()).toEqual([]);
    expect(sentMessages()).toEqual([]);
  });

  it('checks no file for an applied non-image row that carries a file_extension key', async () => {
    const { handleSyncMessage } = await import('../syncService');
    const change = upsert('adventures', 'adventure-a', 1, {
      file_extension: 'png',
    });

    await handleSyncMessage(PEER_ID, rawBatch([change], 1));

    expect(imageFileChecks()).toEqual([]);
    expect(sentMessages()).toEqual([]);
  });

  it('applies a second sync batch only after the first batch has finished', async () => {
    const { handleSyncMessage } = await import('../syncService');
    const firstUpsertDone = Promise.withResolvers<null>();
    const events: string[] = [];
    applyUpsert.mockImplementation(async (_table, row) => {
      events.push(`start ${String(row.id)}`);
      if (row.id === 'adventure-a') await firstUpsertDone.promise;
      events.push(`end ${String(row.id)}`);
      return 'applied';
    });

    const first = handleSyncMessage(
      PEER_ID,
      rawBatch([upsert('adventures', 'adventure-a', 1)], 1),
    );
    const second = handleSyncMessage(
      PEER_ID,
      rawBatch([upsert('adventures', 'adventure-b', 2)], 2),
    );
    await new Promise((resolve) => {
      setTimeout(resolve, 0);
    });
    firstUpsertDone.resolve(null);
    await Promise.all([first, second]);

    expect(events).toEqual([
      'start adventure-a',
      'end adventure-a',
      'start adventure-b',
      'end adventure-b',
    ]);
  });
});

// Every module-level cursor and file buffer of the service lives in the module instance, so each test starts from a fresh import.
const armDefaults = () => {
  vi.resetModules();
  getDevice.mockReset().mockResolvedValue({ id: OWN_DEVICE_ID, name: null });
  applyUpsert.mockReset().mockResolvedValue('applied');
  applyDelete.mockReset().mockResolvedValue('applied');
  setPeerWatermark.mockReset().mockResolvedValue(undefined);
  getPeerWatermark.mockReset().mockResolvedValue(0);
  getChangesSince.mockReset().mockResolvedValue([]);
  getLiveChangesSince.mockReset().mockResolvedValue([]);
  getRowById.mockReset().mockResolvedValue(null);
  getMaxSeq.mockReset().mockResolvedValue(0);
  invoke.mockReset().mockResolvedValue(undefined);
};

type HandleSyncMessage = (
  endpointId: string,
  rawEnvelope: string,
) => Promise<unknown>;

// The pushes a sync-request or pushNewChanges starts run on the module's queue; an empty batch from another peer resolves only after everything queued before it.
const settleQueue = (handleSyncMessage: HandleSyncMessage) =>
  handleSyncMessage('settle-peer', rawBatch([], 0));

const MIGRATION_HEAD = 'head';

const rawHello = (overrides: {
  syncProtocolVersion?: number;
  migrationHead?: string;
  isReply?: boolean;
}): string =>
  JSON.stringify({
    ...buildSyncHelloMessage(MIGRATION_HEAD, false),
    payload: {
      syncProtocolVersion: SYNC_PROTOCOL_VERSION,
      migrationHead: MIGRATION_HEAD,
      ...overrides,
    },
  });

const upsertOf = (
  tableName: string,
  seq: number,
  row: Record<string, unknown>,
): SyncChange => ({
  tableName,
  rowId: String(row.id),
  seq,
  deleted: false,
  deletedAt: null,
  row,
});

const rawRequest = (sinceSeq: number): string =>
  JSON.stringify(buildSyncRequestMessage(sinceSeq));

const changeRecord = (seq: number, deleted = 0, tableName = 'adventures') => ({
  table_name: tableName,
  row_id: `row-${String(seq)}`,
  seq,
  deleted,
  deleted_at: deleted === 1 ? DELETED_AT : null,
});

describe('sendSyncHello', () => {
  beforeEach(armDefaults);

  it("sends this build's hello, not marked as a reply, to the peer", async () => {
    const { sendSyncHello } = await import('../syncService');

    await sendSyncHello(PEER_ID);

    expect(invoke).toHaveBeenCalledTimes(1);
    expect(sentMessages()).toEqual([
      {
        endpointId: PEER_ID,
        message: buildSyncHelloMessage(MIGRATION_HEAD, false),
      },
    ]);
  });

  it('rejects as SyncHandshakeError when the send fails', async () => {
    const { sendSyncHello } = await import('../syncService');
    invoke.mockRejectedValue(new Error('peer unreachable'));

    await expect(sendSyncHello(PEER_ID)).rejects.toMatchObject({
      name: 'SyncHandshakeError',
    });
  });
});

describe('handleSyncMessage with an envelope it cannot use', () => {
  beforeEach(armDefaults);

  it.each([
    ['text that is not JSON', 'not json'],
    [
      'JSON of an unknown message type',
      JSON.stringify({ v: 1, type: 'other' }),
    ],
    [
      'a file-request with an image id that is not a safe id',
      JSON.stringify(buildFileRequestMessage('../escape', 'png')),
    ],
  ])('ignores %s and does nothing', async (_name, raw) => {
    const { handleSyncMessage } = await import('../syncService');

    await expect(handleSyncMessage(PEER_ID, raw)).resolves.toEqual({
      kind: 'ignored',
    });

    expect(invoke).not.toHaveBeenCalled();
  });
});

describe('handleSyncMessage with a sync-hello message', () => {
  beforeEach(armDefaults);

  it('answers a compatible initial hello with a sync-request from the stored watermark, then with a reply hello', async () => {
    const { handleSyncMessage } = await import('../syncService');
    getPeerWatermark.mockResolvedValue(42);

    await expect(
      handleSyncMessage(PEER_ID, rawHello({ isReply: false })),
    ).resolves.toEqual({ kind: 'compat', compat: 'compatible' });

    expect(getPeerWatermark).toHaveBeenCalledWith(PEER_ID);
    expect(sentMessages()).toEqual([
      { endpointId: PEER_ID, message: buildSyncRequestMessage(42) },
      {
        endpointId: PEER_ID,
        message: buildSyncHelloMessage(MIGRATION_HEAD, true),
      },
    ]);
  });

  it('treats a hello without isReply as an initial one and replies to it', async () => {
    const { handleSyncMessage } = await import('../syncService');

    await handleSyncMessage(PEER_ID, rawHello({}));

    expect(sentMessages().map(({ message }) => message)).toEqual([
      buildSyncRequestMessage(0),
      buildSyncHelloMessage(MIGRATION_HEAD, true),
    ]);
  });

  it('answers a compatible reply hello with the sync-request only, so the handshake does not loop', async () => {
    const { handleSyncMessage } = await import('../syncService');

    await handleSyncMessage(PEER_ID, rawHello({ isReply: true }));

    expect(sentMessages().map(({ message }) => message)).toEqual([
      buildSyncRequestMessage(0),
    ]);
  });

  it.each([
    [
      'another protocol version',
      { syncProtocolVersion: SYNC_PROTOCOL_VERSION + 1 },
    ],
    ['another migration head', { migrationHead: 'other-head' }],
    [
      'another protocol version and another migration head',
      {
        syncProtocolVersion: SYNC_PROTOCOL_VERSION + 1,
        migrationHead: 'other-head',
      },
    ],
  ])(
    'reports a hello with %s as incompatible and sends nothing',
    async (_name, overrides) => {
      const { handleSyncMessage } = await import('../syncService');

      await expect(
        handleSyncMessage(PEER_ID, rawHello(overrides)),
      ).resolves.toEqual({ kind: 'compat', compat: 'incompatible' });

      expect(getPeerWatermark).not.toHaveBeenCalled();
      expect(invoke).not.toHaveBeenCalled();
    },
  );

  it('still reports compatible and sends no reply hello when the sync-request cannot be sent', async () => {
    const { handleSyncMessage } = await import('../syncService');
    invoke.mockRejectedValue(new Error('peer unreachable'));

    await expect(
      handleSyncMessage(PEER_ID, rawHello({ isReply: false })),
    ).resolves.toEqual({ kind: 'compat', compat: 'compatible' });

    expect(invoke).toHaveBeenCalledTimes(1);
  });

  it('still reports compatible and sends nothing when the watermark cannot be read', async () => {
    const { handleSyncMessage } = await import('../syncService');
    getPeerWatermark.mockRejectedValue(new Error('disk'));

    await expect(handleSyncMessage(PEER_ID, rawHello({}))).resolves.toEqual({
      kind: 'compat',
      compat: 'compatible',
    });

    expect(invoke).not.toHaveBeenCalled();
  });
});

describe('handleSyncMessage with a sync-request message and pushNewChanges', () => {
  beforeEach(armDefaults);

  it('confirms the peer compatible and pushes the changes after sinceSeq as one batch, live rows read at push time and tombstones as they are', async () => {
    const { handleSyncMessage } = await import('../syncService');
    const row = { id: 'row-6', updated_at: UPDATED_AT };
    getChangesSince.mockResolvedValueOnce([
      changeRecord(6),
      changeRecord(8, 1),
    ]);
    getRowById.mockResolvedValue(row);

    await expect(handleSyncMessage(PEER_ID, rawRequest(5))).resolves.toEqual({
      kind: 'compat',
      compat: 'compatible',
    });
    await settleQueue(handleSyncMessage);

    expect(getChangesSince.mock.calls).toEqual([[5, BATCH_LIMIT]]);
    expect(getRowById).toHaveBeenCalledTimes(1);
    expect(getRowById).toHaveBeenCalledWith('adventures', 'row-6');
    expect(sentMessages()).toEqual([
      {
        endpointId: PEER_ID,
        message: buildSyncBatchMessage(
          [
            {
              tableName: 'adventures',
              rowId: 'row-6',
              seq: 6,
              deleted: false,
              deletedAt: null,
              row,
            },
            {
              tableName: 'adventures',
              rowId: 'row-8',
              seq: 8,
              deleted: true,
              deletedAt: DELETED_AT,
              row: null,
            },
          ],
          8,
        ),
      },
    ]);
  });

  it('leaves out a change whose row was deleted since it was read and still reports the batch up to the last seq', async () => {
    const { handleSyncMessage } = await import('../syncService');
    getChangesSince.mockResolvedValueOnce([changeRecord(1), changeRecord(2)]);
    getRowById.mockImplementation((_table, rowId) =>
      Promise.resolve(rowId === 'row-2' ? { id: 'row-2' } : null),
    );

    await handleSyncMessage(PEER_ID, rawRequest(0));
    await settleQueue(handleSyncMessage);

    expect(sentMessages().map(({ message }) => message)).toEqual([
      buildSyncBatchMessage(
        [
          {
            tableName: 'adventures',
            rowId: 'row-2',
            seq: 2,
            deleted: false,
            deletedAt: null,
            row: { id: 'row-2' },
          },
        ],
        2,
      ),
    ]);
  });

  it("adds each row's parents whose own changes come in a later batch, and their parents in turn, looking each parent up once", async () => {
    const { handleSyncMessage } = await import('../syncService');
    const sessionA = { id: 'session-a', adventure_id: 'adventure-p' };
    const sessionB = { id: 'session-b', adventure_id: 'adventure-p' };
    const adventure = { id: 'adventure-p', image_id: 'image-p' };
    const image = { id: 'image-p' };
    const rows: Record<string, Record<string, unknown>> = {
      'session-a': sessionA,
      'session-b': sessionB,
      'adventure-p': adventure,
      'image-p': image,
    };
    getChangesSince.mockResolvedValueOnce([
      { ...changeRecord(2, 0, 'sessions'), row_id: 'session-a' },
      { ...changeRecord(3, 0, 'sessions'), row_id: 'session-b' },
    ]);
    getRowById.mockImplementation((_table, rowId) =>
      Promise.resolve(rows[rowId] ?? null),
    );
    getLiveChangesSince.mockImplementation((_sinceSeq, tableName) =>
      Promise.resolve(
        tableName === 'adventures'
          ? [{ ...changeRecord(9), row_id: 'adventure-p' }]
          : [{ ...changeRecord(12, 0, 'images'), row_id: 'image-p' }],
      ),
    );

    await handleSyncMessage(PEER_ID, rawRequest(1));
    await settleQueue(handleSyncMessage);

    expect(getLiveChangesSince.mock.calls).toEqual([
      [3, 'adventures', ['adventure-p']],
      [3, 'images', ['image-p']],
    ]);
    expect(sentMessages().map(({ message }) => message)).toEqual([
      buildSyncBatchMessage(
        [
          upsertOf('sessions', 2, sessionA),
          upsertOf('sessions', 3, sessionB),
          upsertOf('adventures', 9, adventure),
          upsertOf('images', 12, image),
        ],
        3,
      ),
    ]);
  });

  it('sends a parent that two rows of different depth share only once', async () => {
    const { handleSyncMessage } = await import('../syncService');
    const session = { id: 'session-a', adventure_id: 'adventure-p' };
    const otherAdventure = { id: 'adventure-o', image_id: 'image-p' };
    const adventure = { id: 'adventure-p', image_id: 'image-p' };
    const image = { id: 'image-p' };
    const rows: Record<string, Record<string, unknown>> = {
      'session-a': session,
      'adventure-o': otherAdventure,
      'adventure-p': adventure,
      'image-p': image,
    };
    getChangesSince.mockResolvedValueOnce([
      { ...changeRecord(2), row_id: 'adventure-o' },
      { ...changeRecord(3, 0, 'sessions'), row_id: 'session-a' },
    ]);
    getRowById.mockImplementation((_table, rowId) =>
      Promise.resolve(rows[rowId] ?? null),
    );
    getLiveChangesSince.mockImplementation((_sinceSeq, tableName) =>
      Promise.resolve(
        tableName === 'adventures'
          ? [{ ...changeRecord(9), row_id: 'adventure-p' }]
          : [{ ...changeRecord(12, 0, 'images'), row_id: 'image-p' }],
      ),
    );

    await handleSyncMessage(PEER_ID, rawRequest(1));
    await settleQueue(handleSyncMessage);

    expect(getLiveChangesSince).toHaveBeenCalledTimes(2);
    expect(sentMessages().map(({ message }) => message)).toEqual([
      buildSyncBatchMessage(
        [
          upsertOf('adventures', 2, otherAdventure),
          upsertOf('sessions', 3, session),
          upsertOf('images', 12, image),
          upsertOf('adventures', 9, adventure),
        ],
        3,
      ),
    ]);
  });

  it('looks up no parent that is already in the batch, none for a row without a parent id, and none for a tombstone', async () => {
    const { handleSyncMessage } = await import('../syncService');
    const adventure = { id: 'adventure-p', image_id: null };
    const session = { id: 'session-a', adventure_id: 'adventure-p' };
    const rows: Record<string, Record<string, unknown>> = {
      'adventure-p': adventure,
      'session-a': session,
    };
    getChangesSince.mockResolvedValueOnce([
      { ...changeRecord(1), row_id: 'adventure-p' },
      { ...changeRecord(2, 0, 'sessions'), row_id: 'session-a' },
      changeRecord(3, 1, 'sessions'),
    ]);
    getRowById.mockImplementation((_table, rowId) =>
      Promise.resolve(rows[rowId] ?? null),
    );

    await handleSyncMessage(PEER_ID, rawRequest(0));
    await settleQueue(handleSyncMessage);

    expect(getLiveChangesSince).not.toHaveBeenCalled();
    expect(sentMessages()).toHaveLength(1);
  });

  it('sends a row of a table the registry does not list without looking up any parent of it', async () => {
    const { handleSyncMessage } = await import('../syncService');
    const row = { id: 'row-2', adventure_id: 'adventure-p' };
    getChangesSince.mockResolvedValueOnce([
      changeRecord(2, 0, 'retired_table'),
    ]);
    getRowById.mockResolvedValue(row);

    await handleSyncMessage(PEER_ID, rawRequest(1));
    await settleQueue(handleSyncMessage);

    expect(getLiveChangesSince).not.toHaveBeenCalled();
    expect(sentMessages().map(({ message }) => message)).toEqual([
      buildSyncBatchMessage([upsertOf('retired_table', 2, row)], 2),
    ]);
  });

  it('leaves out a parent whose row was deleted since its change was read, and looks up no parent of it', async () => {
    const { handleSyncMessage } = await import('../syncService');
    const session = { id: 'session-a', adventure_id: 'adventure-p' };
    getChangesSince.mockResolvedValueOnce([
      { ...changeRecord(2, 0, 'sessions'), row_id: 'session-a' },
    ]);
    getRowById.mockImplementation((_table, rowId) =>
      Promise.resolve(rowId === 'session-a' ? session : null),
    );
    getLiveChangesSince.mockResolvedValue([
      { ...changeRecord(9), row_id: 'adventure-p' },
    ]);

    await handleSyncMessage(PEER_ID, rawRequest(1));
    await settleQueue(handleSyncMessage);

    expect(getLiveChangesSince).toHaveBeenCalledTimes(1);
    expect(sentMessages().map(({ message }) => message)).toEqual([
      buildSyncBatchMessage([upsertOf('sessions', 2, session)], 2),
    ]);
  });

  it('sends nothing when there are no changes after sinceSeq', async () => {
    const { handleSyncMessage } = await import('../syncService');

    await handleSyncMessage(PEER_ID, rawRequest(3));
    await settleQueue(handleSyncMessage);

    expect(getChangesSince.mock.calls).toEqual([[3, BATCH_LIMIT]]);
    expect(invoke).not.toHaveBeenCalled();
  });

  it('asks for the next batch from the last seq while a batch comes back full, and stops at the first short one', async () => {
    const { handleSyncMessage } = await import('../syncService');
    const fullBatch = Array.from({ length: BATCH_LIMIT }, (_, index) =>
      changeRecord(index + 1, 1),
    );
    getChangesSince
      .mockResolvedValueOnce(fullBatch)
      .mockResolvedValueOnce([changeRecord(BATCH_LIMIT + 1, 1)]);

    await handleSyncMessage(PEER_ID, rawRequest(0));
    await settleQueue(handleSyncMessage);

    expect(getChangesSince.mock.calls).toEqual([
      [0, BATCH_LIMIT],
      [BATCH_LIMIT, BATCH_LIMIT],
    ]);
    expect(
      sentMessages().map(
        ({ message }) =>
          (message as { payload: { maxSeq: number } }).payload.maxSeq,
      ),
    ).toEqual([BATCH_LIMIT, BATCH_LIMIT + 1]);
  });

  it('does not ask again after a batch one change short of full', async () => {
    const { handleSyncMessage } = await import('../syncService');
    getChangesSince.mockResolvedValueOnce(
      Array.from({ length: BATCH_LIMIT - 1 }, (_, index) =>
        changeRecord(index + 1, 1),
      ),
    );

    await handleSyncMessage(PEER_ID, rawRequest(0));
    await settleQueue(handleSyncMessage);

    expect(getChangesSince).toHaveBeenCalledTimes(1);
    expect(sentMessages()).toHaveLength(1);
  });

  it('keeps the peer behind when a batch cannot be sent, so the next push starts again from the same cursor', async () => {
    const { handleSyncMessage, pushNewChanges } =
      await import('../syncService');
    getChangesSince.mockResolvedValue([changeRecord(7, 1)]);
    invoke.mockRejectedValue(new Error('peer dropped'));
    getMaxSeq.mockResolvedValue(7);
    await handleSyncMessage(PEER_ID, rawRequest(0));
    await settleQueue(handleSyncMessage);
    getChangesSince.mockClear();

    await pushNewChanges();
    await settleQueue(handleSyncMessage);

    expect(getChangesSince.mock.calls).toEqual([[0, BATCH_LIMIT]]);
  });

  it('records the sent seq as the peer cursor, so the next push does not send the batch again', async () => {
    const { handleSyncMessage, pushNewChanges } =
      await import('../syncService');
    getChangesSince.mockResolvedValueOnce([changeRecord(7, 1)]);
    getMaxSeq.mockResolvedValue(7);
    await handleSyncMessage(PEER_ID, rawRequest(0));
    await settleQueue(handleSyncMessage);
    getChangesSince.mockClear();

    await pushNewChanges();
    await settleQueue(handleSyncMessage);

    expect(getChangesSince).not.toHaveBeenCalled();
  });

  it('pushes only to the peers whose cursor is behind the newest seq', async () => {
    const { handleSyncMessage, pushNewChanges } =
      await import('../syncService');
    await handleSyncMessage('peer-behind', rawRequest(3));
    await handleSyncMessage('peer-level', rawRequest(5));
    await handleSyncMessage('peer-ahead', rawRequest(9));
    await settleQueue(handleSyncMessage);
    getChangesSince.mockClear();
    getMaxSeq.mockResolvedValue(5);

    await pushNewChanges();
    await settleQueue(handleSyncMessage);

    expect(getChangesSince.mock.calls).toEqual([[3, BATCH_LIMIT]]);
  });

  it('rejects pushNewChanges as SyncPushError when the newest seq cannot be read', async () => {
    const { pushNewChanges } = await import('../syncService');
    getMaxSeq.mockRejectedValue(new Error('disk'));

    await expect(pushNewChanges()).rejects.toMatchObject({
      name: 'SyncPushError',
    });
  });

  it('keeps applying batches after a push failed', async () => {
    const { handleSyncMessage } = await import('../syncService');
    getChangesSince.mockRejectedValueOnce(new Error('disk'));
    await handleSyncMessage(PEER_ID, rawRequest(0));

    await expect(
      handleSyncMessage(PEER_ID, rawBatch([upsert('adventures', 'a', 1)], 1)),
    ).resolves.toEqual({ kind: 'applied' });

    expect(applyUpsert).toHaveBeenCalledTimes(1);
  });
});

describe('resetPeerSession', () => {
  beforeEach(armDefaults);

  it('forgets the peer cursor, so pushNewChanges no longer pushes to it, and keeps the cursors of other peers', async () => {
    const { handleSyncMessage, pushNewChanges, resetPeerSession } =
      await import('../syncService');
    await handleSyncMessage('peer-gone', rawRequest(1));
    await handleSyncMessage('peer-kept', rawRequest(2));
    await settleQueue(handleSyncMessage);
    getChangesSince.mockClear();
    getMaxSeq.mockResolvedValue(10);

    resetPeerSession('peer-gone');
    await pushNewChanges();
    await settleQueue(handleSyncMessage);

    expect(getChangesSince.mock.calls).toEqual([[2, BATCH_LIMIT]]);
  });

  it('drops the file chunks received so far, so a later transfer saves only its own chunks', async () => {
    const { handleSyncMessage, resetPeerSession } =
      await import('../syncService');
    await handleSyncMessage(
      PEER_ID,
      JSON.stringify(
        buildFileChunkMessage('image-a', 'png', 0, 'STALE', false),
      ),
    );

    resetPeerSession(PEER_ID);
    await handleSyncMessage(
      PEER_ID,
      JSON.stringify(buildFileChunkMessage('image-a', 'png', 0, 'FRESH', true)),
    );

    expect(invoke).toHaveBeenCalledWith('save_image_bytes', {
      id: 'image-a',
      extension: 'png',
      dataBase64: 'FRESH',
    });
  });
});

describe('handleSyncMessage with a file-request message', () => {
  beforeEach(armDefaults);

  const rawFileRequest = JSON.stringify(
    buildFileRequestMessage('image-a', 'png'),
  );

  const stubFile = (base64: string) =>
    invoke.mockImplementation((command) =>
      command === 'read_image_bytes'
        ? Promise.resolve(base64)
        : Promise.resolve(undefined),
    );

  const sentChunks = () =>
    sentMessages().map(
      ({ message }) =>
        (
          message as {
            payload: { seqNo: number; dataBase64: string; last: boolean };
          }
        ).payload,
    );

  it('reads the image file by id and extension and sends it as one last chunk when it is small', async () => {
    const { handleSyncMessage } = await import('../syncService');
    stubFile('SMALL');

    await expect(handleSyncMessage(PEER_ID, rawFileRequest)).resolves.toEqual({
      kind: 'none',
    });

    expect(invoke).toHaveBeenCalledWith('read_image_bytes', {
      id: 'image-a',
      extension: 'png',
    });
    expect(sentMessages()).toEqual([
      {
        endpointId: PEER_ID,
        message: buildFileChunkMessage('image-a', 'png', 0, 'SMALL', true),
      },
    ]);
  });

  it('sends an empty file as one empty last chunk', async () => {
    const { handleSyncMessage } = await import('../syncService');
    stubFile('');

    await handleSyncMessage(PEER_ID, rawFileRequest);

    expect(sentChunks()).toEqual([
      {
        imageId: 'image-a',
        extension: 'png',
        seqNo: 0,
        dataBase64: '',
        last: true,
      },
    ]);
  });

  // The largest multiple of three source bytes that fits in 256 KiB, so every chunk but the last decodes without base64 padding.
  const CHUNK_SOURCE_BYTES = 256 * 1024 - 1;

  it('splits a large file into numbered chunks of the largest padding-free size within 256 KiB that join back to the file, only the final one marked last', async () => {
    const { handleSyncMessage } = await import('../syncService');
    const source = Uint8Array.from(
      { length: 600_000 },
      (_, index) => index % 251,
    );
    stubFile(Buffer.from(source).toString('base64'));

    await handleSyncMessage(PEER_ID, rawFileRequest);

    const chunks = sentChunks();
    expect(chunks.map((chunk) => chunk.seqNo)).toEqual([0, 1, 2]);
    expect(chunks.map((chunk) => chunk.last)).toEqual([false, false, true]);
    expect(
      chunks.map((chunk) => Buffer.from(chunk.dataBase64, 'base64').length),
    ).toEqual([
      CHUNK_SOURCE_BYTES,
      CHUNK_SOURCE_BYTES,
      600_000 - 2 * CHUNK_SOURCE_BYTES,
    ]);
    expect(
      Buffer.concat(
        chunks.map((chunk) => Buffer.from(chunk.dataBase64, 'base64')),
      ),
    ).toEqual(Buffer.from(source));
  });

  it('sends a file of exactly one chunk as a single last chunk, with no empty chunk after it', async () => {
    const { handleSyncMessage } = await import('../syncService');
    stubFile(Buffer.alloc(CHUNK_SOURCE_BYTES, 7).toString('base64'));

    await handleSyncMessage(PEER_ID, rawFileRequest);

    expect(sentChunks().map((chunk) => chunk.last)).toEqual([true]);
  });

  it('sends nothing when the file cannot be read', async () => {
    const { handleSyncMessage } = await import('../syncService');
    invoke.mockRejectedValue(new Error('no such file'));

    await expect(handleSyncMessage(PEER_ID, rawFileRequest)).resolves.toEqual({
      kind: 'none',
    });

    expect(invoke).toHaveBeenCalledTimes(1);
  });

  it('stops after the first chunk that cannot be sent', async () => {
    const { handleSyncMessage } = await import('../syncService');
    invoke.mockImplementation((command) =>
      command === 'read_image_bytes'
        ? Promise.resolve(Buffer.alloc(600_000).toString('base64'))
        : Promise.reject(new Error('peer dropped')),
    );

    await expect(handleSyncMessage(PEER_ID, rawFileRequest)).resolves.toEqual({
      kind: 'none',
    });

    expect(sentMessages()).toHaveLength(1);
  });
});

describe('handleSyncMessage with a file-chunk message', () => {
  beforeEach(armDefaults);

  const rawChunk = (
    imageId: string,
    extension: string,
    seqNo: number,
    data: string,
    last: boolean,
  ) =>
    JSON.stringify(
      buildFileChunkMessage(imageId, extension, seqNo, data, last),
    );

  it("saves nothing until the last chunk, then saves the chunks in the order received under the first chunk's extension", async () => {
    const { handleSyncMessage } = await import('../syncService');

    await expect(
      handleSyncMessage(PEER_ID, rawChunk('image-a', 'png', 0, 'AAA', false)),
    ).resolves.toEqual({ kind: 'none' });
    await handleSyncMessage(
      PEER_ID,
      rawChunk('image-a', 'jpg', 1, 'BBB', false),
    );
    expect(invoke).not.toHaveBeenCalled();

    await handleSyncMessage(
      PEER_ID,
      rawChunk('image-a', 'jpg', 2, 'CCC', true),
    );

    expect(invoke.mock.calls).toEqual([
      [
        'save_image_bytes',
        { id: 'image-a', extension: 'png', dataBase64: 'AAABBBCCC' },
      ],
    ]);
  });

  it('keeps the chunks of two images apart', async () => {
    const { handleSyncMessage } = await import('../syncService');

    await handleSyncMessage(
      PEER_ID,
      rawChunk('image-a', 'png', 0, 'A1', false),
    );
    await handleSyncMessage(
      PEER_ID,
      rawChunk('image-b', 'png', 0, 'B1', false),
    );
    await handleSyncMessage(PEER_ID, rawChunk('image-a', 'png', 1, 'A2', true));
    await handleSyncMessage(PEER_ID, rawChunk('image-b', 'png', 1, 'B2', true));

    expect(invoke.mock.calls.map(([, args]) => args)).toEqual([
      { id: 'image-a', extension: 'png', dataBase64: 'A1A2' },
      { id: 'image-b', extension: 'png', dataBase64: 'B1B2' },
    ]);
  });

  it('starts a second transfer of the same image from nothing once the first was saved', async () => {
    const { handleSyncMessage } = await import('../syncService');
    await handleSyncMessage(
      PEER_ID,
      rawChunk('image-a', 'png', 0, 'ONE', true),
    );
    invoke.mockClear();

    await handleSyncMessage(
      PEER_ID,
      rawChunk('image-a', 'png', 0, 'TWO', true),
    );

    expect(invoke.mock.calls).toEqual([
      [
        'save_image_bytes',
        { id: 'image-a', extension: 'png', dataBase64: 'TWO' },
      ],
    ]);
  });

  it('still resolves when the image cannot be saved', async () => {
    const { handleSyncMessage } = await import('../syncService');
    invoke.mockRejectedValue(new Error('disk full'));

    await expect(
      handleSyncMessage(PEER_ID, rawChunk('image-a', 'png', 0, 'AAA', true)),
    ).resolves.toEqual({ kind: 'none' });
  });
});

describe('handleSyncMessage with a sync-batch from a peer whose id equals this device id', () => {
  beforeEach(armDefaults);

  it('passes force false, since only a peer id greater than this device id forces', async () => {
    const { handleSyncMessage } = await import('../syncService');
    const change = upsert('adventures', 'adventure-a', 1);

    await handleSyncMessage(OWN_DEVICE_ID, rawBatch([change], 1));

    expect(applyUpsert).toHaveBeenCalledWith('adventures', change.row, false);
  });

  it('passes force true for a peer id that sorts below the text a missing identity could be replaced by', async () => {
    const { handleSyncMessage } = await import('../syncService');
    getDevice.mockResolvedValue(null);
    const change = upsert('adventures', 'adventure-a', 1);

    await handleSyncMessage('A', rawBatch([change], 1));

    expect(applyUpsert).toHaveBeenCalledWith('adventures', change.row, true);
  });
});
