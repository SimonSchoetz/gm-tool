// Node host — imported by vite.config.ts and bundled into Vite's config by its loader, which is why it imports ../db/_migrations and this folder's files by relative path: the bundle resolves no path alias.
import { mkdirSync, readdirSync, rmSync } from 'node:fs';
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
import { openSqliteDatabase } from './sqliteDatabase';

const packageJsonSchema = z.object({ version: z.string() });

const TEMP_DIR_NAME = 'gm-tool-web-mode';

export const devDataServer = (): Plugin => {
  let active = false;
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
      const tempDir = join(tmpdir(), TEMP_DIR_NAME);
      rmSync(tempDir, { recursive: true, force: true });
      mkdirSync(tempDir, { recursive: true });
      copyDatabase(sourceDir, tempDir);
      copyImages(sourceDir, tempDir);
      const db = openSqliteDatabase(join(tempDir, INSTALLED_DATABASE_FILE));
      // The test support's `skipBackup` is this same no-op, but its module resolves `@db/_migrations`, an alias the config bundle cannot resolve.
      await runMigrations(db, () => Promise.resolve());
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
          db,
          imagesDir: join(tempDir, 'images'),
          fixturePaths,
          nextFixture: createFixtureCycle(fixturePaths),
          version,
        }),
      );
    },
  };
};
