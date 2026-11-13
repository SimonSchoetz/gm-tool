// @vitest-environment node
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Runs the real devicesService against the real in-memory database, with only the peer commands answered by a stand-in; devicesService.test.ts mocks the db modules to test the service's own branching and error wrapping.

vi.mock('@tauri-apps/plugin-sql', async () => {
  const { openTestDatabase } =
    await import('@db/__tests__/support/sqlite-test-database');
  return { default: { load: () => Promise.resolve(openTestDatabase()) } };
});

vi.mock('@tauri-apps/api/core', async () => {
  const { answerHostCommand } = await import('./support/hostCommands');
  return { invoke: answerHostCommand };
});

const FORGOTTEN_PEER = 'a'.repeat(64);
const KEPT_PEER = 'b'.repeat(64);

const load = async () => {
  const devicesService = await import('@services/devicesService');
  const pairedDeviceDb = await import('@db/paired-device');
  const syncDb = await import('@db/_sync');
  const { getDatabase } = await import('@db/database');
  const readIds = async (tableName: 'paired_devices' | '_sync_peers') =>
    (
      await (
        await getDatabase()
      ).select<{ id: string }[]>(
        // tableName is one of the two literal table names its type admits.
        `SELECT id FROM ${tableName} ORDER BY id`,
      )
    ).map((row) => row.id);
  return { devicesService, pairedDeviceDb, syncDb, readIds };
};

describe('devicesService against the database', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('forgets a device by removing its paired row and its sync state, leaving another peer’s rows', async () => {
    const { devicesService, pairedDeviceDb, syncDb, readIds } = await load();
    for (const peerId of [FORGOTTEN_PEER, KEPT_PEER]) {
      await pairedDeviceDb.create({ id: peerId, name: null });
      await syncDb.setPeerWatermark(peerId, 5);
    }

    await devicesService.forgetDevice(FORGOTTEN_PEER);

    expect(await readIds('paired_devices')).toEqual([KEPT_PEER]);
    expect(await readIds('_sync_peers')).toEqual([KEPT_PEER]);
  });

  it('leaves exactly one paired row when pairing completes twice for one endpoint', async () => {
    const { devicesService, readIds } = await load();

    await devicesService.completePairing(KEPT_PEER, 'Laptop');
    await devicesService.completePairing(KEPT_PEER, 'Laptop');

    expect(await readIds('paired_devices')).toEqual([KEPT_PEER]);
  });
});
