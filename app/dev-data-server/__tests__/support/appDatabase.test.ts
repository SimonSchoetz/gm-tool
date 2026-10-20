// @vitest-environment node
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { readAppDatabaseRows, writeAppDatabase } from './appDatabase';
import { createTempDirectory } from './tempDirectory';

let temp: ReturnType<typeof createTempDirectory>;
let dir: string;

beforeEach(() => {
  temp = createTempDirectory();
  dir = join(temp.dir, 'app-data');
  mkdirSync(dir);
});

afterEach(() => {
  temp.remove();
});

const pairedDeviceColumns = (): unknown[] =>
  readAppDatabaseRows(
    dir,
    "SELECT name FROM pragma_table_info('paired_devices') ORDER BY cid",
  ).map(({ name }) => name);

describe('writeAppDatabase', () => {
  it('writes the rows of each list into its own table', () => {
    writeAppDatabase(dir, {
      notes: [{ id: 'note', body: 'note body' }],
      pairedDevices: [{ id: 'device', name: 'Device name' }],
      syncPeers: [{ id: 'peer', lastReceivedSeq: 7 }],
      system: [{ id: 'key', value: 'value' }],
    });

    expect(readAppDatabaseRows(dir, 'SELECT id, body FROM notes')).toEqual([
      { id: 'note', body: 'note body' },
    ]);
    expect(
      readAppDatabaseRows(dir, 'SELECT id, name FROM paired_devices'),
    ).toEqual([{ id: 'device', name: 'Device name' }]);
    expect(
      readAppDatabaseRows(dir, 'SELECT id, last_received_seq FROM _sync_peers'),
    ).toEqual([{ id: 'peer', last_received_seq: 7 }]);
    expect(readAppDatabaseRows(dir, 'SELECT id, value FROM _system')).toEqual([
      { id: 'key', value: 'value' },
    ]);
  });

  it('writes every table empty when no list is given', () => {
    writeAppDatabase(dir);

    for (const sql of [
      'SELECT id FROM notes',
      'SELECT id FROM paired_devices',
      'SELECT id FROM _sync_peers',
      'SELECT id FROM _system',
    ]) {
      expect(readAppDatabaseRows(dir, sql)).toEqual([]);
    }
  });

  it('leaves the paired_devices table out with omitPairedDevices and writes the others', () => {
    writeAppDatabase(dir, {
      notes: [{ id: 'note', body: 'note body' }],
      omitPairedDevices: true,
    });

    expect(pairedDeviceColumns()).toEqual([]);
    expect(readAppDatabaseRows(dir, 'SELECT id FROM notes')).toEqual([
      { id: 'note' },
    ]);
  });

  it('adds the extra paired_devices column only with pairedDevicesExtraColumn', () => {
    writeAppDatabase(dir);
    const plainColumns = pairedDeviceColumns();
    const extraDir = join(temp.dir, 'extra');
    mkdirSync(extraDir);
    writeAppDatabase(extraDir, { pairedDevicesExtraColumn: true });
    const extraColumns = readAppDatabaseRows(
      extraDir,
      "SELECT name FROM pragma_table_info('paired_devices') ORDER BY cid",
    ).map(({ name }) => name);

    expect(extraColumns).toEqual([...plainColumns, 'extra']);
  });
});
