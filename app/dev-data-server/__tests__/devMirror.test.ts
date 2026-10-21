// @vitest-environment node
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { basename, join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { DATABASE_FILE, DEVICE_SYSTEM_KEY } from '../../domain/database';
import { mirrorInstalledData } from '../devMirror';
import { readAppDatabaseRows, writeAppDatabase } from './support/appDatabase';
import { createTempDirectory } from './support/tempDirectory';

let temp: ReturnType<typeof createTempDirectory>;
let releaseDir: string;
let devDir: string;

beforeEach(() => {
  temp = createTempDirectory();
  releaseDir = join(temp.dir, 'release');
  devDir = join(temp.dir, 'dev');
  mkdirSync(releaseDir);
});

afterEach(() => {
  temp.remove();
});

const mirror = (): ReturnType<typeof mirrorInstalledData> =>
  mirrorInstalledData({ sourceDir: releaseDir, targetDir: devDir });

const writeImage = (dir: string, name: string, content: string): void => {
  mkdirSync(join(dir, 'images'), { recursive: true });
  writeFileSync(join(dir, 'images', name), content);
};

const listing = (dir: string): string[] =>
  readdirSync(dir, { recursive: true }).map(String).sort();

const deviceValue = (id: string): string => JSON.stringify({ id });

describe('mirrorInstalledData', () => {
  it('replaces the dev content with the release content, dev edits and dev-only rows included, and the dev images with the release images', () => {
    writeAppDatabase(releaseDir, {
      notes: [
        { id: 'one', body: 'release one' },
        { id: 'two', body: 'release two' },
      ],
    });
    writeImage(releaseDir, 'release.png', 'release image');
    mkdirSync(devDir);
    writeAppDatabase(devDir, {
      notes: [
        { id: 'one', body: 'edited in dev' },
        { id: 'dev-only', body: 'dev only' },
      ],
    });
    writeImage(devDir, 'stale.png', 'stale image');

    expect(mirror()).toBe('mirrored');

    expect(
      readAppDatabaseRows(devDir, 'SELECT id, body FROM notes ORDER BY id'),
    ).toEqual([
      { id: 'one', body: 'release one' },
      { id: 'two', body: 'release two' },
    ]);
    expect(listing(join(devDir, 'images'))).toEqual(['release.png']);
    expect(readFileSync(join(devDir, 'images', 'release.png'), 'utf8')).toBe(
      'release image',
    );
  });

  it('keeps the dev paired devices, sync peers and device row, takes every other _system row from the release, and removes the stale dev -wal', () => {
    writeAppDatabase(releaseDir, {
      pairedDevices: [{ id: 'release-device', name: 'Release phone' }],
      syncPeers: [{ id: 'release-peer', lastReceivedSeq: 5 }],
      system: [
        { id: DEVICE_SYSTEM_KEY, value: deviceValue('release') },
        { id: 'versioning', value: 'release versioning' },
      ],
    });
    // A WAL writer in another directory holds one dev device only in its -wal; copying its three files while it is open leaves the dev directory looking like an app that crashed.
    const writerDir = join(temp.dir, 'writer');
    mkdirSync(writerDir);
    writeAppDatabase(writerDir, {
      pairedDevices: [
        { id: 'dev-device-1', name: 'Dev one' },
        { id: 'dev-device-2', name: 'Dev two' },
      ],
      syncPeers: [{ id: 'dev-peer', lastReceivedSeq: 9 }],
      system: [
        { id: DEVICE_SYSTEM_KEY, value: deviceValue('dev') },
        { id: 'versioning', value: 'dev versioning' },
      ],
    });
    const writer = new DatabaseSync(join(writerDir, DATABASE_FILE));
    writer.exec('PRAGMA journal_mode = WAL');
    writer.exec(
      "INSERT INTO paired_devices (id, name, created_at, updated_at) VALUES ('dev-device-in-wal', 'Dev in wal', 't', 't')",
    );
    mkdirSync(devDir);
    for (const suffix of ['', '-wal', '-shm']) {
      copyFileSync(
        join(writerDir, `${DATABASE_FILE}${suffix}`),
        join(devDir, `${DATABASE_FILE}${suffix}`),
      );
    }
    writer.close();
    expect(existsSync(join(devDir, `${DATABASE_FILE}-wal`))).toBe(true);

    mirror();

    expect(existsSync(join(devDir, `${DATABASE_FILE}-wal`))).toBe(false);
    expect(existsSync(join(devDir, `${DATABASE_FILE}-shm`))).toBe(false);
    expect(
      readAppDatabaseRows(devDir, 'SELECT id FROM paired_devices ORDER BY id'),
    ).toEqual([
      { id: 'dev-device-1' },
      { id: 'dev-device-2' },
      { id: 'dev-device-in-wal' },
    ]);
    expect(
      readAppDatabaseRows(
        devDir,
        'SELECT id, last_received_seq FROM _sync_peers',
      ),
    ).toEqual([{ id: 'dev-peer', last_received_seq: 9 }]);
    expect(
      readAppDatabaseRows(devDir, 'SELECT id, value FROM _system ORDER BY id'),
    ).toEqual([
      { id: DEVICE_SYSTEM_KEY, value: deviceValue('dev') },
      { id: 'versioning', value: 'release versioning' },
    ]);
  });

  it.each([
    { name: 'dev table has a column the release lacks', devExtra: true },
    { name: 'release table has a column the dev lacks', devExtra: false },
  ])(
    'mirrors without error and carries the shared paired_devices columns when the $name',
    ({ devExtra }) => {
      writeAppDatabase(releaseDir, {
        pairedDevices: [{ id: 'release-device', name: 'Release phone' }],
        pairedDevicesExtraColumn: !devExtra,
      });
      mkdirSync(devDir);
      writeAppDatabase(devDir, {
        pairedDevices: [{ id: 'dev-device', name: 'Dev phone' }],
        pairedDevicesExtraColumn: devExtra,
      });
      const columnsSql = "SELECT name FROM pragma_table_info('paired_devices')";
      expect(readAppDatabaseRows(devDir, columnsSql)).not.toEqual(
        readAppDatabaseRows(releaseDir, columnsSql),
      );

      mirror();

      expect(
        readAppDatabaseRows(devDir, 'SELECT id, name FROM paired_devices'),
      ).toEqual([{ id: 'dev-device', name: 'Dev phone' }]);
    },
  );

  it('mirrors without error, carries the other preserved sets and holds no paired device when the dev database lacks the table', () => {
    writeAppDatabase(releaseDir, {
      pairedDevices: [{ id: 'release-device', name: 'Release phone' }],
    });
    mkdirSync(devDir);
    writeAppDatabase(devDir, {
      omitPairedDevices: true,
      syncPeers: [{ id: 'dev-peer', lastReceivedSeq: 9 }],
    });

    mirror();

    expect(
      readAppDatabaseRows(devDir, 'SELECT id FROM paired_devices'),
    ).toEqual([]);
    expect(readAppDatabaseRows(devDir, 'SELECT id FROM _sync_peers')).toEqual([
      { id: 'dev-peer' },
    ]);
  });

  it('leaves the release directory as it was and the dev connectivity key and database backups in place', () => {
    writeAppDatabase(releaseDir, { notes: [{ id: 'one', body: 'release' }] });
    writeImage(releaseDir, 'release.png', 'release image');
    const releaseListing = listing(releaseDir);
    const releaseBytes = readFileSync(join(releaseDir, DATABASE_FILE));
    mkdirSync(join(devDir, 'connectivity'), { recursive: true });
    writeFileSync(join(devDir, 'connectivity', 'device.key'), 'dev key');
    const backupName = `${DATABASE_FILE}.bak-1`;
    writeFileSync(join(devDir, backupName), 'dev backup');

    mirror();

    expect(listing(releaseDir)).toEqual(releaseListing);
    expect(readFileSync(join(releaseDir, DATABASE_FILE))).toEqual(releaseBytes);
    expect(
      readFileSync(join(devDir, 'connectivity', 'device.key'), 'utf8'),
    ).toBe('dev key');
    expect(readFileSync(join(devDir, backupName), 'utf8')).toBe('dev backup');
  });

  it('touches nothing when the release app has no database, and does not create a missing dev directory', () => {
    expect(mirror()).toBe('no-installed-data');
    expect(existsSync(devDir)).toBe(false);

    mkdirSync(devDir);
    writeAppDatabase(devDir, { notes: [{ id: 'dev', body: 'dev data' }] });
    writeImage(devDir, 'dev.png', 'dev image');
    const devListing = listing(devDir);
    const devBytes = readFileSync(join(devDir, DATABASE_FILE));

    expect(mirror()).toBe('no-installed-data');

    expect(listing(devDir)).toEqual(devListing);
    expect(readFileSync(join(devDir, DATABASE_FILE))).toEqual(devBytes);
  });

  it('throws when the source and target directories are the same one, however spelled, and every file survives', () => {
    writeAppDatabase(releaseDir, { notes: [{ id: 'one', body: 'release' }] });
    writeImage(releaseDir, 'release.png', 'release image');
    const releaseListing = listing(releaseDir);
    const releaseBytes = readFileSync(join(releaseDir, DATABASE_FILE));

    expect(() =>
      mirrorInstalledData({
        sourceDir: releaseDir,
        targetDir: join(releaseDir, '..', basename(releaseDir)),
      }),
    ).toThrow(
      /^The dev data directory .+ is the installed app's data directory; refusing to replace it\.$/,
    );

    expect(listing(releaseDir)).toEqual(releaseListing);
    expect(readFileSync(join(releaseDir, DATABASE_FILE))).toEqual(releaseBytes);
  });

  it('throws naming the table and leaves the old dev data readable, with no staging folder, when the release copy lacks a table the dev database has', () => {
    writeAppDatabase(releaseDir, {
      notes: [{ id: 'release', body: 'release data' }],
      omitPairedDevices: true,
    });
    mkdirSync(devDir);
    writeAppDatabase(devDir, {
      notes: [{ id: 'dev', body: 'dev data' }],
      pairedDevices: [{ id: 'dev-device', name: 'Dev phone' }],
    });
    writeImage(devDir, 'dev.png', 'dev image');

    expect(mirror).toThrow(
      /^The installed app's database lacks the table paired_devices, so the dev app's own rows in it cannot be kept\.$/,
    );

    expect(readAppDatabaseRows(devDir, 'SELECT id FROM notes')).toEqual([
      { id: 'dev' },
    ]);
    expect(
      readAppDatabaseRows(devDir, 'SELECT id FROM paired_devices'),
    ).toEqual([{ id: 'dev-device' }]);
    expect(listing(devDir)).toEqual([
      DATABASE_FILE,
      'images',
      'images/dev.png',
    ]);
  });

  it('creates the dev directory on a first run, holds the release content and none of the release identity rows', () => {
    writeAppDatabase(releaseDir, {
      notes: [{ id: 'one', body: 'release' }],
      pairedDevices: [{ id: 'release-device', name: 'Release phone' }],
      syncPeers: [{ id: 'release-peer', lastReceivedSeq: 5 }],
      system: [
        { id: DEVICE_SYSTEM_KEY, value: deviceValue('release') },
        { id: 'versioning', value: 'release versioning' },
      ],
    });

    expect(mirror()).toBe('mirrored');

    expect(readAppDatabaseRows(devDir, 'SELECT id FROM notes')).toEqual([
      { id: 'one' },
    ]);
    expect(
      readAppDatabaseRows(devDir, 'SELECT id FROM paired_devices'),
    ).toEqual([]);
    expect(readAppDatabaseRows(devDir, 'SELECT id FROM _sync_peers')).toEqual(
      [],
    );
    expect(readAppDatabaseRows(devDir, 'SELECT id FROM _system')).toEqual([
      { id: 'versioning' },
    ]);
  });
});
