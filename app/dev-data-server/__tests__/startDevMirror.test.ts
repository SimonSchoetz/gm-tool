// @vitest-environment node
import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { PassThrough } from 'node:stream';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DATABASE_FILE } from '../../domain/database';
import {
  MIRROR_QUESTION,
  mirrorFromProcess,
  STARTS_ON_OWN_DATA,
  startDevMirror,
} from '../startDevMirror';
import { appDataDirectories } from './support/appDataDirectories';
import { readAppDatabaseRows, writeAppDatabase } from './support/appDatabase';
import { createTempDirectory } from './support/tempDirectory';

let temp: ReturnType<typeof createTempDirectory>;
let releaseDir: string;
let devDir: string;

beforeEach(() => {
  temp = createTempDirectory();
  ({ releaseDir, devDir } = appDataDirectories(temp.dir));
  mkdirSync(releaseDir, { recursive: true });
  writeAppDatabase(releaseDir, { notes: [{ id: 'release', body: 'release' }] });
});

afterEach(() => {
  vi.unstubAllEnvs();
  temp.remove();
});

const writeDevDatabase = (): void => {
  mkdirSync(devDir, { recursive: true });
  writeAppDatabase(devDir, { notes: [{ id: 'dev', body: 'dev' }] });
};

const devNoteIds = (): unknown[] =>
  readAppDatabaseRows(devDir, 'SELECT id FROM notes');

const start = async ({
  interactive,
  answer = '',
  platform = 'darwin',
}: {
  interactive: boolean;
  answer?: string;
  platform?: NodeJS.Platform;
}) => {
  const ask = vi.fn((_question: string) => Promise.resolve(answer));
  const log = vi.fn<(line: string) => void>();
  await startDevMirror({ platform, homeDir: temp.dir, interactive, ask, log });
  return { ask, log };
};

describe('startDevMirror', () => {
  it('mirrors without asking when the dev app has no database yet', async () => {
    const { ask, log } = await start({ interactive: true });

    expect(ask).not.toHaveBeenCalled();
    expect(devNoteIds()).toEqual([{ id: 'release' }]);
    expect(log).toHaveBeenCalledWith(
      `Mirrored the installed app's data into ${devDir}.`,
    );
  });

  it.each(['y', 'YES', ' yes \n'])(
    'asks before replacing existing dev data and mirrors on %j',
    async (answer) => {
      writeDevDatabase();

      const { ask } = await start({ interactive: true, answer });

      expect(ask).toHaveBeenCalledWith(MIRROR_QUESTION);
      expect(devNoteIds()).toEqual([{ id: 'release' }]);
    },
  );

  it.each(['', 'n', 'no', 'ye', 'yess'])(
    'keeps the existing dev data on %j, so a bare Enter or a typo never replaces it',
    async (answer) => {
      writeDevDatabase();

      const { log } = await start({ interactive: true, answer });

      expect(devNoteIds()).toEqual([{ id: 'dev' }]);
      expect(log).toHaveBeenCalledWith(
        `Kept the dev data in ${devDir}. ${STARTS_ON_OWN_DATA}`,
      );
    },
  );

  it('keeps the existing dev data without asking when no terminal can answer', async () => {
    writeDevDatabase();

    const { ask, log } = await start({ interactive: false, answer: 'y' });

    expect(ask).not.toHaveBeenCalled();
    expect(devNoteIds()).toEqual([{ id: 'dev' }]);
    expect(log).toHaveBeenCalledWith(
      `No terminal to ask whether to replace the dev data in ${devDir}, so it is kept. ${STARTS_ON_OWN_DATA}`,
    );
  });

  it('names the expected database path and creates no dev data when the release app has no database', async () => {
    temp.remove();
    temp = createTempDirectory();
    ({ releaseDir, devDir } = appDataDirectories(temp.dir));

    const { log } = await start({ interactive: true });

    expect(log).toHaveBeenCalledWith(
      `No installed app data at ${join(releaseDir, DATABASE_FILE)}, so nothing is mirrored. ${STARTS_ON_OWN_DATA}`,
    );
    expect(existsSync(devDir)).toBe(false);
  });

  it('asks nothing and touches no dev data when the release directory cannot be located', async () => {
    writeDevDatabase();

    const { ask, log } = await start({ interactive: true, platform: 'linux' });

    expect(ask).not.toHaveBeenCalled();
    expect(devNoteIds()).toEqual([{ id: 'dev' }]);
    expect(log).toHaveBeenCalledWith(
      expect.stringContaining(STARTS_ON_OWN_DATA),
    );
  });
});

const collect = (stream: PassThrough): (() => string) => {
  let text = '';
  stream.on('data', (chunk: Buffer) => {
    text += chunk.toString();
  });
  return () => text;
};

describe('mirrorFromProcess', () => {
  it('asks in the terminal, mirrors on a typed yes, releases the terminal and exits 0', async () => {
    writeDevDatabase();
    vi.stubEnv('HOME', temp.dir);
    const stdin = Object.assign(new PassThrough(), { isTTY: true });
    const stdout = new PassThrough();
    const written = collect(stdout);

    const exit = mirrorFromProcess({
      platform: 'darwin',
      stdin,
      stdout,
      stderr: new PassThrough(),
    });
    stdin.write('yes\n');

    expect(await exit).toBe(0);
    expect(written()).toContain(MIRROR_QUESTION);
    expect(written()).toContain(
      `Mirrored the installed app's data into ${devDir}.`,
    );
    expect(devNoteIds()).toEqual([{ id: 'release' }]);
    expect(stdin.listenerCount('data')).toBe(0);
  });

  it('shows the default in the question and tells the developer which data the dev app starts on', () => {
    expect(MIRROR_QUESTION).toMatch(/\[y\/N\] $/);
    expect(STARTS_ON_OWN_DATA).toMatch(/starts on the data it already holds/);
  });

  it('keeps existing dev data unasked when stdin is not a terminal', async () => {
    writeDevDatabase();
    vi.stubEnv('HOME', temp.dir);
    const stdout = new PassThrough();
    const written = collect(stdout);

    const exit = await mirrorFromProcess({
      platform: 'darwin',
      stdin: new PassThrough(),
      stdout,
      stderr: new PassThrough(),
    });

    expect(exit).toBe(0);
    expect(written()).not.toContain(MIRROR_QUESTION);
    expect(devNoteIds()).toEqual([{ id: 'dev' }]);
  });

  it('writes the error to stderr and exits 1 when the mirror fails', async () => {
    temp.remove();
    temp = createTempDirectory();
    ({ releaseDir, devDir } = appDataDirectories(temp.dir));
    mkdirSync(releaseDir, { recursive: true });
    writeAppDatabase(releaseDir, {
      notes: [{ id: 'release', body: 'release' }],
      omitPairedDevices: true,
    });
    vi.stubEnv('HOME', temp.dir);
    const stderr = new PassThrough();
    const written = collect(stderr);

    const exit = await mirrorFromProcess({
      platform: 'darwin',
      stdin: new PassThrough(),
      stdout: new PassThrough(),
      stderr,
    });

    expect(exit).toBe(1);
    expect(written()).toContain('paired_devices');
  });
});
