// Node host — imported by vite.config.ts and bundled into Vite's config by its loader, which is why it imports ../db/_migrations and this folder's files by relative path: the bundle resolves no path alias.
import { mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import type { Plugin } from 'vite';
import { z } from 'zod';
import { runMigrations } from '../db/_migrations';
import { createFixtureCycle } from './fixtureCycle';
import {
  assertInstalledAppData,
  copyDatabase,
  copyImages,
  INSTALLED_DATABASE_FILE,
  resolveInstalledAppDataDir,
} from './installedAppData';
import { readRepositoryJson, tauriConfigSchema } from './repositoryJson';
import { createRequestHandler } from './requestHandler';
import { openSqliteDatabase, type SqliteDatabase } from './sqliteDatabase';

const packageJsonSchema = z.object({ version: z.string() });

const TEMP_DIR_PREFIX = 'gm-tool-web-mode-';

export const devDataServer = (): Plugin => {
  let active = false;
  // Each server start copies the installed app's data into a directory of its own, so a second web server never empties the copy the first one serves; closeServer removes it on close and on restart.
  let tempDir: string | null = null;
  let db: SqliteDatabase | null = null;
  return {
    name: 'gm-tool-dev-data-server',
    configResolved(config) {
      active = config.command === 'serve' && config.mode === 'web';
      if (
        active &&
        config.server.host !== false &&
        config.server.host !== 'localhost'
      ) {
        throw new Error(
          `The dev data server serves the installed app's data, so server.host must be false or 'localhost'; it is ${String(config.server.host)} — remove --host or set it to localhost.`,
        );
      }
    },
    async configureServer(server) {
      if (!active) return;
      // The release app's identifier, not tauri.dev.conf.json's: web mode reads the data of the installed release app.
      const { identifier } = readRepositoryJson(
        '../src-tauri/tauri.conf.json',
        tauriConfigSchema,
      );
      const sourceDir = resolveInstalledAppDataDir(
        process.platform,
        homedir(),
        identifier,
      );
      assertInstalledAppData(sourceDir);
      const serverDir = mkdtempSync(join(tmpdir(), TEMP_DIR_PREFIX));
      tempDir = serverDir;
      copyDatabase(sourceDir, serverDir);
      copyImages(sourceDir, serverDir);
      const serverDb = openSqliteDatabase(
        join(serverDir, INSTALLED_DATABASE_FILE),
      );
      db = serverDb;
      // The test support's `skipBackup` is this same no-op, but its module resolves `@db/_migrations`, an alias the config bundle cannot resolve.
      await runMigrations(serverDb, () => Promise.resolve());
      const { version } = readRepositoryJson(
        '../package.json',
        packageJsonSchema,
      );
      const fixturesDir = resolve(import.meta.dirname, 'fixtures/images');
      const fixturePaths = readdirSync(fixturesDir).map((name) =>
        join(fixturesDir, name),
      );
      server.middlewares.use(
        createRequestHandler({
          db: serverDb,
          imagesDir: join(serverDir, 'images'),
          fixturePaths,
          nextFixture: createFixtureCycle(fixturePaths),
          version,
        }),
      );
    },
    async closeServer() {
      if (db) {
        await db.close();
        db = null;
      }
      if (tempDir) {
        rmSync(tempDir, { recursive: true, force: true });
        tempDir = null;
      }
    },
  };
};
