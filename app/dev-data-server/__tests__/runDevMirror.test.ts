// @vitest-environment node
import { spawnSync } from 'node:child_process';
import type { SpawnSyncReturns } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  INSTALLED_DATABASE_FILE,
  resolveInstalledAppDataDir,
} from '../installedAppData';
import { readRepositoryJson, tauriConfigSchema } from '../repositoryJson';
import { readAppDatabaseRows, writeAppDatabase } from './support/appDatabase';
import { createTempDirectory } from './support/tempDirectory';

const ENTRY_PATH = join(import.meta.dirname, '..', 'runDevMirror.ts');

let temp: ReturnType<typeof createTempDirectory>;
let releaseDir: string;
let devDir: string;

beforeEach(() => {
  temp = createTempDirectory();
  const releaseIdentifier = readRepositoryJson(
    '../src-tauri/tauri.conf.json',
    tauriConfigSchema,
  ).identifier;
  const devIdentifier = readRepositoryJson(
    '../src-tauri/tauri.dev.conf.json',
    tauriConfigSchema,
  ).identifier;
  releaseDir = resolveInstalledAppDataDir(
    'darwin',
    temp.dir,
    releaseIdentifier,
  );
  devDir = resolveInstalledAppDataDir('darwin', temp.dir, devIdentifier);
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
  it('exits 0 and mirrors the release data into the dev identifier directory beside it, leaving the release directory unchanged', () => {
    writeAppDatabase(releaseDir, { notes: [{ id: 'one', body: 'release' }] });
    const releaseListing = readdirSync(releaseDir).sort();

    const result = runEntry();

    expect(result.status).toBe(0);
    expect(readAppDatabaseRows(devDir, 'SELECT id FROM notes')).toEqual([
      { id: 'one' },
    ]);
    expect(readdirSync(releaseDir).sort()).toEqual(releaseListing);
  });

  it('exits 0, names the expected database path and leaves the dev directory untouched when the release app has no database', () => {
    const result = runEntry();

    expect(result.status).toBe(0);
    expect(result.stdout).toContain(join(releaseDir, INSTALLED_DATABASE_FILE));
    expect(existsSync(devDir)).toBe(false);
  });

  it('exits non-zero, names the table and leaves the old dev data intact when the release database lacks a table', () => {
    writeAppDatabase(releaseDir, {
      notes: [{ id: 'release', body: 'release' }],
      omitPairedDevices: true,
    });
    mkdirSync(devDir, { recursive: true });
    writeAppDatabase(devDir, { notes: [{ id: 'dev', body: 'dev' }] });

    const result = runEntry();

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('paired_devices');
    expect(readAppDatabaseRows(devDir, 'SELECT id FROM notes')).toEqual([
      { id: 'dev' },
    ]);
  });
});
