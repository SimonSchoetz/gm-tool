// Node host — bundled into Vite's config by its loader, which is why it imports ../db/_migrations and this folder's files by relative path: the bundle resolves no path alias.
import { mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Plugin } from 'vite';
import { z } from 'zod';
import { DATABASE_FILE } from '../domain/database/index.ts';
import { runMigrations } from '../db/_migrations/index.ts';
import { createFixtureCycle, readFixturePaths } from './fixtureCycle.ts';
import {
  assertDevAppData,
  copyDatabase,
  copyImages,
  resolveAppDataDir,
} from './installedAppData.ts';
import { readAppIdentifiers, readRepositoryJson } from './repositoryJson.ts';
import { createRequestHandler } from './requestHandler.ts';
import { seedDatabase } from './seedDatabase.ts';
import { openSqliteDatabase, type SqliteDatabase } from './sqliteDatabase.ts';

const packageJsonSchema = z.object({ version: z.string() });

const TEMP_DIR_PREFIX = 'gm-tool-web-mode-';

// Set by the `web:seed` script in app/package.json; without it web mode serves a copy of the dev app's data.
const WEB_DATA_ENV = 'GM_TOOL_WEB_DATA';
const SEEDED_WEB_DATA = 'seed';

// The dev app's data, not the installed release app's: it holds the developer's test data, and the copy keeps web-mode edits and the checkout's pending migrations out of the dev app's own database.
const devAppDataDir = (): string => {
  const dir = resolveAppDataDir(
    process.platform,
    homedir(),
    readAppIdentifiers().dev,
  );
  assertDevAppData(dir);
  return dir;
};

export const devDataServer = (): Plugin => {
  // Vite calls `configResolved`, which sets `active`, before `configureServer` reads it, so this initial value is never read.
  let active = false;
  // Each server start copies the dev app's data into a directory of its own, so a second web server never empties the copy the first one serves; closeServer removes it on close and on restart.
  let tempDir: string | null = null;
  let db: SqliteDatabase | null = null;
  return {
    // Nothing in app/ looks the plugin up by name; Vite uses it only to label the plugin in its log output.
    name: 'gm-tool-dev-data-server',
    configResolved(config) {
      active = config.command === 'serve' && config.mode === 'web';
      if (
        active &&
        config.server.host !== false &&
        config.server.host !== 'localhost'
      ) {
        throw new Error(
          `The dev data server serves the dev app's data, so server.host must be false or 'localhost'; it is ${String(config.server.host)} — remove --host or set it to localhost.`,
        );
      }
    },
    async configureServer(server) {
      if (!active) return;
      const seeded = process.env[WEB_DATA_ENV] === SEEDED_WEB_DATA;
      // The seeded mode reads no app data at all.
      const sourceDir = seeded ? null : devAppDataDir();
      const serverDir = mkdtempSync(join(tmpdir(), TEMP_DIR_PREFIX));
      tempDir = serverDir;
      if (sourceDir === null) {
        mkdirSync(join(serverDir, 'images'));
      } else {
        copyDatabase(sourceDir, serverDir);
        copyImages(sourceDir, serverDir);
      }
      const serverDb = openSqliteDatabase(join(serverDir, DATABASE_FILE));
      db = serverDb;
      const imagesDir = join(serverDir, 'images');
      const fixturePaths = readFixturePaths();
      // The test support's `skipBackup` is this same no-op, but its module resolves `@db/_migrations`, an alias the config bundle cannot resolve.
      // `runMigrations` awaits the callback's result, and awaiting `undefined` continues just as awaiting a resolved promise does.
      await runMigrations(serverDb, () => Promise.resolve());
      if (seeded) {
        await seedDatabase(
          { db: serverDb, imagesDir, fixturePaths },
          server.config,
        );
      }
      const { version } = readRepositoryJson(
        '../package.json',
        packageJsonSchema,
      );
      server.middlewares.use(
        createRequestHandler({
          db: serverDb,
          imagesDir,
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
