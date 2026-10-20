// Node host — imported by vitePlugin.ts. 'com.gm-tool' and 'gm_tool.db' describe the installed release app — the identifier of app/src-tauri/tauri.conf.json and the file db/database.ts passes to plugin-sql — and are not imported from there because Vite's config bundle resolves no path alias and db/database.ts imports @platform.
import { copyFileSync, cpSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

const INSTALLED_APP_IDENTIFIER = 'com.gm-tool';
export const INSTALLED_DATABASE_FILE = 'gm_tool.db';

export const resolveInstalledAppDataDir = (
  platform: NodeJS.Platform,
  homeDir: string,
): string => {
  if (platform !== 'darwin') {
    throw new Error(
      `The dev data server reads the installed app's data from ~/Library/Application Support/${INSTALLED_APP_IDENTIFIER}, which exists on macOS only; this platform is ${platform}.`,
    );
  }
  return join(
    homeDir,
    'Library',
    'Application Support',
    INSTALLED_APP_IDENTIFIER,
  );
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
    // A -wal file beside the database holds committed rows the main file lacks until a checkpoint, so the copy goes through SQLite's VACUUM INTO, which writes a consistent single-file snapshot and leaves the source as it is.
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
