// @vitest-environment node
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  assertInstalledAppData,
  copyDatabase,
  copyImages,
  INSTALLED_DATABASE_FILE,
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
  const db = openSqliteDatabase(join(dir, INSTALLED_DATABASE_FILE));
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
    ).toThrow('Library/Application Support/com.app');
  });
});

describe('assertInstalledAppData', () => {
  it('throws naming the missing database path and passes once the file exists', () => {
    const databasePath = join(sourceDir, INSTALLED_DATABASE_FILE);

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
    const sourcePath = join(sourceDir, INSTALLED_DATABASE_FILE);
    const source = new DatabaseSync(sourcePath);
    source.exec("CREATE TABLE t (a TEXT); INSERT INTO t (a) VALUES ('kept')");
    source.close();
    const sourceBytes = readFileSync(sourcePath);
    const sourceListing = readdirSync(sourceDir).sort();

    copyDatabase(sourceDir, targetDir);

    expect(readFileSync(join(targetDir, INSTALLED_DATABASE_FILE))).toEqual(
      sourceBytes,
    );
    expect(readFileSync(sourcePath)).toEqual(sourceBytes);
    expect(readdirSync(sourceDir).sort()).toEqual(sourceListing);
    expect(readdirSync(targetDir)).toEqual([INSTALLED_DATABASE_FILE]);
  });

  it('copies the committed rows a WAL writer still holds open, without changing the source main file or its directory', async () => {
    const sourcePath = join(sourceDir, INSTALLED_DATABASE_FILE);
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
