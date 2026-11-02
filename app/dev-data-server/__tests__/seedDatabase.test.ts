// @vitest-environment node
import { readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { resolveConfig, type ViteDevServer } from 'vite';
import { afterEach, describe, expect, it, vi, type MockInstance } from 'vitest';
import { runMigrations } from '../../db/_migrations';
import {
  openTestDatabase,
  skipBackup,
} from '../../db/__tests__/support/sqlite-test-database';
import { readFixturePaths } from '../fixtureCycle';
import { seedDatabase } from '../seedDatabase';
import type { SqliteDatabase } from '../sqliteDatabase';
import { createTempDirectory } from './support/tempDirectory';

// A spy on the `close` of each seed server the unit creates, so a test can see that it was closed.
const closeSpies = vi.hoisted((): MockInstance[] => []);
// Each seed server the unit creates, so a test can read its resolved config.
const seedServers = vi.hoisted((): ViteDevServer[] => []);
vi.mock('vite', async (importOriginal) => {
  const actual = await importOriginal<typeof import('vite')>();
  return {
    ...actual,
    createServer: async (...args: Parameters<typeof actual.createServer>) => {
      const server = await actual.createServer(...args);
      closeSpies.push(vi.spyOn(server, 'close'));
      seedServers.push(server);
      return server;
    },
  };
});

// The web server's config as `vite --mode web` resolves it, so the seed's server gets the project's real aliases; seed.test.ts pins what the seed writes.
const webServerConfig = () =>
  resolveConfig(
    {
      configFile: resolve(import.meta.dirname, '../../vite.config.ts'),
      mode: 'web',
    },
    'serve',
  );

const imagesDirectories: ReturnType<typeof createTempDirectory>[] = [];

const seedContext = (db: SqliteDatabase) => {
  const imagesDirectory = createTempDirectory();
  imagesDirectories.push(imagesDirectory);
  return {
    db,
    imagesDir: imagesDirectory.dir,
    fixturePaths: readFixturePaths(),
  };
};

afterEach(() => {
  for (const imagesDirectory of imagesDirectories.splice(0)) {
    imagesDirectory.remove();
  }
});

describe('seedDatabase', () => {
  it('runs the seed on the given database through the app services, with `@platform` answering from that database and images folder', async () => {
    const db = openTestDatabase();
    await runMigrations(db, skipBackup);
    const context = seedContext(db);

    await seedDatabase(context, await webServerConfig());

    expect(
      await db.select('SELECT name FROM adventures ORDER BY name'),
    ).toEqual([{ name: 'Imageless Adventure' }, { name: 'Seed Adventure' }]);
    expect(readdirSync(context.imagesDir)).toHaveLength(8);
    expect(
      await db.select(
        "SELECT name FROM encounter_queue_items WHERE kind = 'event'",
      ),
    ).toEqual([{ name: 'Seed Event' }]);
    expect(closeSpies.at(-1)).toHaveBeenCalledTimes(1);
  });

  // Sharing the web server's cache folder makes each server re-optimize the other's dependencies at every start, because their configs differ.
  it('keeps the seed server out of the web server cache folder', async () => {
    const db = openTestDatabase();
    await runMigrations(db, skipBackup);
    const config = await webServerConfig();

    await seedDatabase(seedContext(db), config);

    expect(seedServers.at(-1)?.config.cacheDir).not.toBe(config.cacheDir);
  });

  it('rejects with the seed error and still closes its server when the seed fails', async () => {
    // A closed database fails the seed's first statement.
    const db = openTestDatabase();
    await db.close();

    await expect(
      seedDatabase(seedContext(db), await webServerConfig()),
    ).rejects.toThrow(
      /^Failed to create adventure: Error: database is not open$/,
    );
    expect(closeSpies.at(-1)).toHaveBeenCalledTimes(1);
  });
});
