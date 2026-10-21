// @vitest-environment node
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { DATABASE_FILE } from '../../domain/database';
import {
  assertInstalledAppData,
  copyDatabase,
  copyImages,
  hasInstalledAppData,
  resolveInstalledAppDataDir,
} from '../installedAppData';
import { openSqliteDatabase } from '../sqliteDatabase';
import { createTempDirectory } from './support/tempDirectory';

let temp: ReturnType<typeof createTempDirectory>;
let sourceDir: string;
let targetDir: string;

beforeEach(() => {
  temp = createTempDirectory();
  sourceDir = join(temp.dir, 'source');
  targetDir = join(temp.dir, 'target');
  mkdirSync(sourceDir);
  mkdirSync(targetDir);
});

afterEach(() => {
  temp.remove();
});

const readRows = async (dir: string): Promise<unknown> => {
  const db = openSqliteDatabase(join(dir, DATABASE_FILE));
  const rows = await db.select('SELECT a FROM t ORDER BY a');
  await db.close();
  return rows;
};

describe('resolveInstalledAppDataDir', () => {
  it('resolves the macOS data directory from the given home and refuses another platform naming that path', () => {
    expect(resolveInstalledAppDataDir('darwin', '/Users/gm', 'com.app')).toBe(
      '/Users/gm/Library/Application Support/com.app',
    );
    expect(() =>
      resolveInstalledAppDataDir('linux', '/home/gm', 'com.app'),
    ).toThrow(
      /^The dev data server reads the installed app's data from ~\/Library\/Application Support\/com\.app, which exists on macOS only; this platform is linux\.$/,
    );
  });
});

describe('hasInstalledAppData', () => {
  it('is false for a directory without the database file and true once it exists', () => {
    expect(hasInstalledAppData(sourceDir)).toBe(false);

    writeFileSync(join(sourceDir, DATABASE_FILE), '');
    expect(hasInstalledAppData(sourceDir)).toBe(true);
  });
});

describe('assertInstalledAppData', () => {
  it('throws naming the missing database path and passes once the file exists', () => {
    const databasePath = join(sourceDir, DATABASE_FILE);

    expect(() => {
      assertInstalledAppData(sourceDir);
    }).toThrow(databasePath);

    writeFileSync(databasePath, '');
    expect(() => {
      assertInstalledAppData(sourceDir);
    }).not.toThrow();
  });
});

describe('copyDatabase', () => {
  it('copies a closed database byte for byte and leaves the source directory as it was', () => {
    const sourcePath = join(sourceDir, DATABASE_FILE);
    const source = new DatabaseSync(sourcePath);
    source.exec("CREATE TABLE t (a TEXT); INSERT INTO t (a) VALUES ('kept')");
    source.close();
    const sourceBytes = readFileSync(sourcePath);
    const sourceListing = readdirSync(sourceDir).sort();

    copyDatabase(sourceDir, targetDir);

    expect(readFileSync(join(targetDir, DATABASE_FILE))).toEqual(sourceBytes);
    expect(readFileSync(sourcePath)).toEqual(sourceBytes);
    expect(readdirSync(sourceDir).sort()).toEqual(sourceListing);
    expect(readdirSync(targetDir)).toEqual([DATABASE_FILE]);
  });

  it('copies the committed rows a WAL writer still holds open, without changing the source main file or its directory', async () => {
    const sourcePath = join(sourceDir, DATABASE_FILE);
    const writer = new DatabaseSync(sourcePath);
    writer.exec('PRAGMA journal_mode = WAL');
    writer.exec(
      "CREATE TABLE t (a TEXT); INSERT INTO t (a) VALUES ('in-wal-1'), ('in-wal-2')",
    );
    expect(existsSync(`${sourcePath}-wal`)).toBe(true);
    const sourceBytes = readFileSync(sourcePath);
    const sourceListing = readdirSync(sourceDir).sort();

    copyDatabase(sourceDir, targetDir);

    expect(await readRows(targetDir)).toEqual([
      { a: 'in-wal-1' },
      { a: 'in-wal-2' },
    ]);
    expect(readFileSync(sourcePath)).toEqual(sourceBytes);
    expect(readdirSync(sourceDir).sort()).toEqual(sourceListing);
    writer.close();
  });

  it('copies the rows of a database left with its -wal and -shm files and, as the only connection, checkpoints them into the source on close', async () => {
    // A writer in another directory leaves a committed row in its -wal; copying its three files while it is open makes `sourceDir` look like an app that crashed or persisted its WAL.
    const writerDir = join(temp.dir, 'writer');
    mkdirSync(writerDir);
    const writer = new DatabaseSync(join(writerDir, DATABASE_FILE));
    writer.exec('PRAGMA journal_mode = WAL');
    writer.exec("CREATE TABLE t (a TEXT); INSERT INTO t (a) VALUES ('in-wal')");
    for (const suffix of ['', '-wal', '-shm']) {
      copyFileSync(
        join(writerDir, `${DATABASE_FILE}${suffix}`),
        join(sourceDir, `${DATABASE_FILE}${suffix}`),
      );
    }
    writer.close();
    expect(readdirSync(sourceDir).sort()).toEqual([
      DATABASE_FILE,
      `${DATABASE_FILE}-shm`,
      `${DATABASE_FILE}-wal`,
    ]);

    copyDatabase(sourceDir, targetDir);

    expect(await readRows(targetDir)).toEqual([{ a: 'in-wal' }]);
    expect(readdirSync(sourceDir)).toEqual([DATABASE_FILE]);
    expect(await readRows(sourceDir)).toEqual([{ a: 'in-wal' }]);
  });
});

describe('copyImages', () => {
  it('copies every image file into the target and leaves the source as it was', () => {
    const sourceImages = join(sourceDir, 'images');
    mkdirSync(sourceImages);
    writeFileSync(join(sourceImages, 'one.png'), 'one');
    writeFileSync(join(sourceImages, 'two.jpg'), 'two');

    copyImages(sourceDir, targetDir);

    const targetImages = join(targetDir, 'images');
    expect(readdirSync(targetImages).sort()).toEqual(['one.png', 'two.jpg']);
    expect(readFileSync(join(targetImages, 'two.jpg'), 'utf8')).toBe('two');
    expect(readdirSync(sourceImages).sort()).toEqual(['one.png', 'two.jpg']);
  });

  it('creates an empty images directory when the source has none', () => {
    copyImages(sourceDir, targetDir);

    expect(readdirSync(join(targetDir, 'images'))).toEqual([]);
    expect(existsSync(join(sourceDir, 'images'))).toBe(false);
  });
});
