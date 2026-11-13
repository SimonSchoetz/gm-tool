// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { BATCH_LIMIT } from '@services/syncService';

// Two devices, each a separate module graph (`vi.resetModules()` before its dynamic imports) and so its own `db/database.ts` singleton over its own in-memory SQLite, run the real `syncService` and `@db/_sync` against each other. Only the transport is replaced: `send_message` hands the envelope to the other device's `handleSyncMessage`. Unlike `syncService.test.ts`, which mocks `@db/_sync` to test the service's own branching, this file's subject is that both databases end up with the same rows.

type Transport = {
  send: (endpointId: string, envelope: string) => Promise<void>;
};

const transport = vi.hoisted<{ current: Transport | null }>(() => ({
  current: null,
}));

vi.mock('@tauri-apps/plugin-sql', async () => {
  const { openTestDatabase } =
    await import('@db/__tests__/support/sqlite-test-database');
  return { default: { load: () => Promise.resolve(openTestDatabase()) } };
});

vi.mock('@tauri-apps/api/core', () => ({
  invoke: (command: string, args?: Record<string, unknown>) => {
    if (command === 'send_message') {
      if (transport.current === null) throw new Error('No transport wired');
      return transport.current.send(
        String(args?.endpointId),
        String(args?.envelope),
      );
    }
    // Synced image rows ask whether their file exists; answering yes keeps the file transfer, which this file does not test, out of the exchange.
    if (command === 'check_image_file_exists') return Promise.resolve(true);
    return Promise.reject(new Error(`Unexpected command: ${command}`));
  },
}));

const ID_A = 'a'.repeat(64);
const ID_B = 'b'.repeat(64);

const openDevice = async (deviceId: string) => {
  vi.resetModules();
  const syncService = await import('@services/syncService');
  const { getDatabase } = await import('@db/database');
  const systemDb = await import('@db/_system');
  const syncDb = await import('@db/_sync');
  const adventureDb = await import('@db/adventure');
  const sessionDb = await import('@db/session');
  const baseEntityDb = await import('@db/base-entity');
  const contentSectionDb = await import('@db/base-entity-content-section');
  const pinnedOrderService = await import('@services/pinnedOrderService');
  await systemDb.updateDevice({ id: deviceId, name: null });
  return {
    id: deviceId,
    syncService,
    getDatabase,
    syncedTableNames: syncDb.SYNCED_TABLE_NAMES,
    adventureDb,
    sessionDb,
    baseEntityDb,
    contentSectionDb,
    pinnedOrderService,
  };
};

type Device = Awaited<ReturnType<typeof openDevice>>;

// Delivery is not awaited by the sender, as a real `send_message` resolves once the envelope leaves, not once the peer has applied it. Every step of the exchange chains microtasks only (node:sqlite runs synchronously), so a macrotask turn with nothing in flight means the exchange is over.
const connect = (a: Device, b: Device) => {
  let inFlight = 0;
  const failures: unknown[] = [];
  let failSend: ((envelope: string) => boolean) | null = null;
  const sent: { to: string; type: string }[] = [];

  transport.current = {
    send: (endpointId, envelope) => {
      const recipient = endpointId === a.id ? a : b;
      const sender = recipient === a ? b : a;
      const { type } = JSON.parse(envelope) as { type: string };
      if (failSend?.(envelope)) {
        failSend = null;
        return Promise.reject(new Error('Injected send failure'));
      }
      sent.push({ to: recipient.id, type });
      inFlight += 1;
      void Promise.resolve()
        .then(() =>
          recipient.syncService.handleSyncMessage(sender.id, envelope),
        )
        .catch((error: unknown) => {
          failures.push(error);
        })
        .finally(() => {
          inFlight -= 1;
        });
      return Promise.resolve();
    },
  };

  const settle = async () => {
    do {
      await new Promise((resolve) => setTimeout(resolve, 0));
    } while (inFlight > 0);
    expect(failures).toEqual([]);
  };

  return {
    batchesSentTo: (device: Device) =>
      sent.filter(({ to, type }) => to === device.id && type === 'sync-batch')
        .length,
    failNextSendWhere: (predicate: (envelope: string) => boolean) => {
      failSend = predicate;
    },
    handshake: async () => {
      a.syncService.resetPeerSession(b.id);
      b.syncService.resetPeerSession(a.id);
      await a.syncService.sendSyncHello(b.id);
      await settle();
    },
    settle,
  };
};

const readTable = async (device: Device, tableName: string) => {
  const db = await device.getDatabase();
  // tableName comes from SYNCED_TABLE_NAMES, a fixed registry constant.
  return db.select<Record<string, unknown>[]>(
    `SELECT * FROM ${tableName} ORDER BY id`,
  );
};

const expectConverged = async (a: Device, b: Device) => {
  for (const tableName of a.syncedTableNames) {
    expect({
      tableName,
      rows: await readTable(b, tableName),
    }).toEqual({ tableName, rows: await readTable(a, tableName) });
  }
};

const rowIds = async (device: Device, tableName: string) =>
  (await readTable(device, tableName)).map((row) => row.id);

const setTime = (iso: string) => {
  vi.setSystemTime(new Date(iso));
};

describe('syncService between two devices', () => {
  let a: Device;
  let b: Device;

  beforeEach(async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    setTime('2026-01-01T00:00:00.000Z');
    a = await openDevice(ID_A);
    b = await openDevice(ID_B);
  });

  afterEach(() => {
    transport.current = null;
    vi.useRealTimers();
  });

  it('brings rows created on one device to the other', async () => {
    setTime('2026-01-02T00:00:00.000Z');
    const adventureId = await a.adventureDb.create();
    const sessionId = await a.sessionDb.create(adventureId);

    await connect(a, b).handshake();

    expect(await rowIds(b, 'adventures')).toEqual([adventureId]);
    expect(await rowIds(b, 'sessions')).toEqual([sessionId]);
    await expectConverged(a, b);
  });

  it('keeps the edit with the later updated_at on both devices', async () => {
    setTime('2026-01-02T00:00:00.000Z');
    const adventureId = await a.adventureDb.create();
    const link = connect(a, b);
    await link.handshake();

    setTime('2026-01-03T00:00:00.000Z');
    await b.adventureDb.update(adventureId, { name: 'Earlier edit on B' });
    setTime('2026-01-04T00:00:00.000Z');
    await a.adventureDb.update(adventureId, { name: 'Later edit on A' });
    await link.handshake();

    const [adventureOnB] = await readTable(b, 'adventures');
    expect(adventureOnB).toMatchObject({
      name: 'Later edit on A',
      updated_at: '2026-01-04T00:00:00.000Z',
    });
    await expectConverged(a, b);
  });

  it('brings an edit made after the handshake over when the editing device pushes, without a new handshake', async () => {
    setTime('2026-01-02T00:00:00.000Z');
    const adventureId = await a.adventureDb.create();
    const link = connect(a, b);
    await link.handshake();

    setTime('2026-01-03T00:00:00.000Z');
    await a.adventureDb.update(adventureId, { name: 'Edited after handshake' });
    await a.syncService.pushNewChanges();
    await link.settle();

    const [adventureOnB] = await readTable(b, 'adventures');
    expect(adventureOnB).toMatchObject({ name: 'Edited after handshake' });
    await expectConverged(a, b);
  });

  // A delete trigger stamps deleted_at with SQLite's own clock, which fake timers do not reach, so each edit below is placed far from the real present on the side the case needs.
  it('removes the row on both devices when the delete is later than the edit', async () => {
    setTime('2020-01-01T00:00:00.000Z');
    const adventureId = await a.adventureDb.create();
    const keptId = await a.adventureDb.create();
    const link = connect(a, b);
    await link.handshake();

    setTime('2020-01-02T00:00:00.000Z');
    await b.adventureDb.update(adventureId, { name: 'Edit before delete' });
    await a.adventureDb.remove(adventureId);
    await link.handshake();

    expect(await rowIds(b, 'adventures')).toEqual([keptId]);
    await expectConverged(a, b);
  });

  it('restores the row on both devices when the edit is later than the delete', async () => {
    setTime('2020-01-01T00:00:00.000Z');
    const adventureId = await a.adventureDb.create();
    const link = connect(a, b);
    await link.handshake();

    await a.adventureDb.remove(adventureId);
    setTime('2099-01-01T00:00:00.000Z');
    await b.adventureDb.update(adventureId, { name: 'Edit after delete' });
    await link.handshake();

    const [adventureOnA] = await readTable(a, 'adventures');
    expect(adventureOnA).toMatchObject({
      id: adventureId,
      name: 'Edit after delete',
    });
    await expectConverged(a, b);
  });

  const pinnedOrderOf = async (device: Device, baseEntityId: string) => {
    const db = await device.getDatabase();
    const [row] = await db.select<{ pinned_order: number | null }[]>(
      'SELECT pinned_order FROM base_entities WHERE id = $1',
      [baseEntityId],
    );
    return row.pinned_order;
  };

  // ID_A sorts below ID_B, so a change made on A reaches B without the tie-breaking force flag syncService sets only for the greater sender id; each direction is covered because the defect showed in one only.
  it.each([
    { pinOn: 'the lower-id device', pinner: () => a, peer: () => b },
    { pinOn: 'the higher-id device', pinner: () => b, peer: () => a },
  ])(
    'brings a pin and an unpin made on $pinOn to the other device',
    async ({ pinner, peer }) => {
      setTime('2026-01-02T00:00:00.000Z');
      const adventureId = await a.adventureDb.create();
      const baseEntityId = await a.baseEntityDb.create('npcs', adventureId);
      const link = connect(a, b);
      await link.handshake();

      setTime('2026-01-03T00:00:00.000Z');
      await pinner().pinnedOrderService.pinEntity('npcs', baseEntityId);
      await link.handshake();

      expect(await pinnedOrderOf(peer(), baseEntityId)).toBe(0);
      await expectConverged(a, b);

      setTime('2026-01-04T00:00:00.000Z');
      await pinner().pinnedOrderService.unpinEntity('npcs', baseEntityId);
      await link.handshake();

      expect(await pinnedOrderOf(peer(), baseEntityId)).toBeNull();
      await expectConverged(a, b);
    },
  );

  it('brings a parent and its children over without a foreign-key failure', async () => {
    setTime('2026-01-02T00:00:00.000Z');
    const adventureId = await a.adventureDb.create();
    const baseEntityId = await a.baseEntityDb.create('npcs', adventureId);
    const sectionIds = [
      await a.contentSectionDb.create({
        base_entity_id: baseEntityId,
        type: 'text',
        sort_order: 0,
      }),
      await a.contentSectionDb.create({
        base_entity_id: baseEntityId,
        type: 'text',
        sort_order: 1,
      }),
    ].sort();

    await connect(a, b).handshake();

    expect(await rowIds(b, 'base_entities')).toEqual([baseEntityId]);
    expect(await rowIds(b, 'base_entity_content_sections')).toEqual(sectionIds);
    await expectConverged(a, b);
  });

  it('brings a child over when its parent was edited after it and the two land in different batches', async () => {
    setTime('2026-01-02T00:00:00.000Z');
    const adventureId = await a.adventureDb.create();
    const sessionId = await a.sessionDb.create(adventureId);
    for (let i = 0; i < BATCH_LIMIT; i++) {
      await a.adventureDb.create();
    }
    // The edit rewrites the parent's change record with the newest seq, so the child's record now sorts a full batch ahead of it.
    setTime('2026-01-03T00:00:00.000Z');
    await a.adventureDb.update(adventureId, { name: 'Edited parent' });

    const link = connect(a, b);
    await link.handshake();

    expect(link.batchesSentTo(b)).toBe(2);
    expect(await rowIds(b, 'sessions')).toEqual([sessionId]);
    await expectConverged(a, b);
  });

  it('brings every row over when the changes exceed one batch', async () => {
    setTime('2026-01-02T00:00:00.000Z');
    const created: string[] = [];
    for (let i = 0; i < BATCH_LIMIT + 50; i++) {
      created.push(await a.adventureDb.create());
    }

    const link = connect(a, b);
    await link.handshake();

    expect(link.batchesSentTo(b)).toBe(2);
    expect(await rowIds(b, 'adventures')).toEqual(created.sort());
    await expectConverged(a, b);
  });

  it('converges after a send fails mid-way and a new handshake follows', async () => {
    setTime('2026-01-02T00:00:00.000Z');
    const created: string[] = [];
    for (let i = 0; i < BATCH_LIMIT + 50; i++) {
      created.push(await a.adventureDb.create());
    }

    const link = connect(a, b);
    let batchesSeen = 0;
    link.failNextSendWhere((envelope) => {
      if (!envelope.includes('"sync-batch"')) return false;
      batchesSeen += 1;
      return batchesSeen === 2;
    });
    await link.handshake();
    expect((await rowIds(b, 'adventures')).length).toBeLessThan(created.length);

    await link.handshake();

    expect(await rowIds(b, 'adventures')).toEqual(created.sort());
    await expectConverged(a, b);
  });
});
