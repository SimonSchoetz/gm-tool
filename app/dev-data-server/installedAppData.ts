// Node host — loaded by Vite's config bundle and, in the first half of the `dev` script, by `node` directly, so its relative imports carry the `.ts` extension Node's type stripping requires. The app identifier comes from app/src-tauri/tauri.conf.json.
import { copyFileSync, cpSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { DATABASE_FILE } from '../domain/database/index.ts';

export const resolveInstalledAppDataDir = (
  platform: NodeJS.Platform,
  homeDir: string,
  identifier: string,
): string => {
  if (platform !== 'darwin') {
    throw new Error(
      `The dev data server reads the installed app's data from ~/Library/Application Support/${identifier}, which exists on macOS only; this platform is ${platform}.`,
    );
  }
  return join(homeDir, 'Library', 'Application Support', identifier);
};

export const hasInstalledAppData = (dir: string): boolean =>
  existsSync(join(dir, DATABASE_FILE));

export const assertInstalledAppData = (dir: string): void => {
  if (!hasInstalledAppData(dir)) {
    const databasePath = join(dir, DATABASE_FILE);
    throw new Error(
      `No installed app data at ${databasePath}. Install the release app and open it once, so it creates its database, before running web mode.`,
    );
  }
};

export const copyDatabase = (sourceDir: string, targetDir: string): void => {
  const sourcePath = join(sourceDir, DATABASE_FILE);
  const targetPath = join(targetDir, DATABASE_FILE);
  if (existsSync(`${sourcePath}-wal`)) {
    // A -wal file beside the database holds committed rows the main file lacks until a checkpoint, so the copy goes through SQLite's VACUUM INTO, which writes a consistent single-file snapshot of both; the source's rows are untouched, and when no other connection holds it open, closing this one checkpoints the -wal into the main file and removes it, the one change web mode and the dev mirror make to the installed files.
    const source = new DatabaseSync(sourcePath);
    source.prepare('VACUUM INTO ?').run(targetPath);
    source.close();
    return;
  }
  // Without a -wal file the main file is the whole database, so a byte copy is complete and opens no connection on the source.
  copyFileSync(sourcePath, targetPath);
};

export const copyImages = (sourceDir: string, targetDir: string): void => {
  const sourceImagesDir = join(sourceDir, 'images');
  const targetImagesDir = join(targetDir, 'images');
  if (existsSync(sourceImagesDir)) {
    cpSync(sourceImagesDir, targetImagesDir, { recursive: true });
    return;
  }
  mkdirSync(targetImagesDir, { recursive: true });
};
