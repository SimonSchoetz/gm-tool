// Node host — imported by vitePlugin.ts. 'gm_tool.db' describes the installed release app — the file db/database.ts passes to plugin-sql — and is not imported from there because Vite's config bundle resolves no path alias and db/database.ts imports @platform; the app identifier comes from app/src-tauri/tauri.conf.json, which vitePlugin.ts reads.
import { copyFileSync, cpSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

export const INSTALLED_DATABASE_FILE = 'gm_tool.db';

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

export const assertInstalledAppData = (dir: string): void => {
  const databasePath = join(dir, INSTALLED_DATABASE_FILE);
  if (!existsSync(databasePath)) {
    throw new Error(
      `No installed app data at ${databasePath}. Install the release app and open it once, so it creates its database, before running web mode.`,
    );
  }
};

export const copyDatabase = (sourceDir: string, targetDir: string): void => {
  const sourcePath = join(sourceDir, INSTALLED_DATABASE_FILE);
  const targetPath = join(targetDir, INSTALLED_DATABASE_FILE);
  if (existsSync(`${sourcePath}-wal`)) {
    // A -wal file beside the database holds committed rows the main file lacks until a checkpoint, so the copy goes through SQLite's VACUUM INTO, which writes a consistent single-file snapshot of both; the source's rows are untouched, and when no other connection holds it open, closing this one checkpoints the -wal into the main file and removes it, the one change web mode makes to the installed files.
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
