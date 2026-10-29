// @vitest-environment node
import { spawnSync } from 'node:child_process';
import type { SpawnSyncReturns } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { DATABASE_FILE } from '../../domain/database';
import { appDataDirectories } from './support/appDataDirectories';
import { readAppDatabaseRows, writeAppDatabase } from './support/appDatabase';
import { createTempDirectory } from './support/tempDirectory';

const ENTRY_PATH = join(import.meta.dirname, '..', 'runDevMirror.ts');

let temp: ReturnType<typeof createTempDirectory>;
let releaseDir: string;
let devDir: string;

beforeEach(() => {
  temp = createTempDirectory();
  ({ releaseDir, devDir } = appDataDirectories(temp.dir));
  mkdirSync(releaseDir, { recursive: true });
});

afterEach(() => {
  temp.remove();
});

const runEntry = (): SpawnSyncReturns<string> =>
  spawnSync(process.execPath, [ENTRY_PATH], {
    env: { ...process.env, HOME: temp.dir },
    encoding: 'utf8',
  });

describe.runIf(process.platform === 'darwin')('runDevMirror', () => {
  it('exits 0 and mirrors the release data into the dev identifier directory beside it', () => {
    writeAppDatabase(releaseDir, { notes: [{ id: 'one', body: 'release' }] });

    const result = runEntry();

    expect(result.status).toBe(0);
    expect(readAppDatabaseRows(devDir, 'SELECT id FROM notes')).toEqual([
      { id: 'one' },
    ]);
  });

  it('exits non-zero, names the table and swaps no database in when the release database lacks a table', () => {
    writeAppDatabase(releaseDir, {
      notes: [{ id: 'release', body: 'release' }],
      omitPairedDevices: true,
    });

    const result = runEntry();

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('paired_devices');
    expect(existsSync(join(devDir, DATABASE_FILE))).toBe(false);
  });
});
