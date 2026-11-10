// @vitest-environment node
import { mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { resolveConfig, type ResolvedConfig, type ViteDevServer } from 'vite';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { DATABASE_FILE } from '../../domain/database';
import { readRepositoryJson } from '../repositoryJson';
import type { createRequestHandler as createRequestHandlerType } from '../requestHandler';
import type { seedDatabase as seedDatabaseType } from '../seedDatabase';
import { devDataServer } from '../vitePlugin';
import { appDataDirectories } from './support/appDataDirectories';
import { createTempDirectory } from './support/tempDirectory';

// The context the plugin computes for the request handler is its outcome; the handler itself has its own tests.
const createRequestHandler = vi.hoisted(() =>
  vi.fn<typeof createRequestHandlerType>(() => () => undefined),
);
vi.mock('../requestHandler', () => ({ createRequestHandler }));

// The real seed by default; a test that needs a seed holding no image replaces it for one start.
const seedDatabase = vi.hoisted(() => vi.fn<typeof seedDatabaseType>());
vi.mock('../seedDatabase', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../seedDatabase')>();
  seedDatabase.mockImplementation(actual.seedDatabase);
  return { seedDatabase };
});

describe('devDataServer configResolved', () => {
  const resolvedConfig = (
    command: 'serve' | 'build',
    mode: string,
    host: string | boolean,
  ) => ({ command, mode, server: { host } }) as unknown as ResolvedConfig;

  const runConfigResolved = (config: ResolvedConfig) => {
    const hook = devDataServer().configResolved as unknown as (
      config: ResolvedConfig,
    ) => void;
    hook(config);
  };

  it('refuses to start in web mode on a server.host other than false or localhost', () => {
    expect(() => {
      runConfigResolved(resolvedConfig('serve', 'web', true));
    }).toThrow(
      /^The dev data server serves the dev app's data, so server\.host must be false or 'localhost'; it is true — remove --host or set it to localhost\.$/,
    );
    expect(() => {
      runConfigResolved(resolvedConfig('serve', 'web', '0.0.0.0'));
    }).toThrow(
      /^The dev data server serves the dev app's data, so server\.host must be false or 'localhost'; it is 0\.0\.0\.0 — remove --host or set it to localhost\.$/,
    );
  });

  it('accepts false and localhost in web mode', () => {
    expect(() => {
      runConfigResolved(resolvedConfig('serve', 'web', false));
    }).not.toThrow();
    expect(() => {
      runConfigResolved(resolvedConfig('serve', 'web', 'localhost'));
    }).not.toThrow();
  });

  it('is inert outside serve in web mode, whatever the host', () => {
    expect(() => {
      runConfigResolved(resolvedConfig('build', 'web', true));
    }).not.toThrow();
    expect(() => {
      runConfigResolved(resolvedConfig('serve', 'development', true));
    }).not.toThrow();
  });
});

describe('devDataServer configureServer and closeServer', () => {
  let home: ReturnType<typeof createTempDirectory>;
  let devDir: string;

  const webModeDirs = () =>
    readdirSync(tmpdir()).filter((name) =>
      name.startsWith('gm-tool-web-mode-'),
    );

  // `config` is read only by the seeded mode, whose seed server takes the web server's aliases from it.
  const startServer = async (
    mode: string,
    config: ResolvedConfig | null = null,
  ) => {
    const plugin = devDataServer();
    const configResolved = plugin.configResolved as unknown as (
      config: ResolvedConfig,
    ) => void;
    configResolved({
      command: 'serve',
      mode,
      server: { host: false },
    } as unknown as ResolvedConfig);
    const configureServer = plugin.configureServer as unknown as (
      server: ViteDevServer,
    ) => Promise<void>;
    const use = vi.fn();
    await configureServer({
      middlewares: { use },
      config,
    } as unknown as ViteDevServer);
    return {
      use,
      close: plugin.closeServer as unknown as () => Promise<void>,
    };
  };

  const startWebServer = async () => (await startServer('web')).close;

  const writeAppData = (dir: string, probe: string) => {
    mkdirSync(join(dir, 'images'), { recursive: true });
    const db = new DatabaseSync(join(dir, DATABASE_FILE));
    db.exec('CREATE TABLE probe (a TEXT)');
    db.prepare('INSERT INTO probe (a) VALUES (?)').run(probe);
    db.close();
    writeFileSync(join(dir, 'images', `${probe}.png`), 'png');
  };

  beforeEach(() => {
    createRequestHandler.mockClear();
    home = createTempDirectory();
    const directories = appDataDirectories(home.dir);
    devDir = directories.devDir;
    // The installed release app's data sits beside the dev app's, so a plugin that read the release directory would hand the handler its rows.
    writeAppData(directories.releaseDir, 'release');
    writeAppData(devDir, 'dev');
    vi.stubEnv('HOME', home.dir);
    // A temp root of the test's own, which os.tmpdir() reads from TMPDIR on every call: in the shared one, another process's web-mode copies would join the listing.
    const tempRoot = join(home.dir, 'tmp');
    mkdirSync(tempRoot);
    vi.stubEnv('TMPDIR', tempRoot);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    home.remove();
  });

  it('gives each server start its own copy, and closing one server removes only its copy', async () => {
    const closeFirst = await startWebServer();
    const closeSecond = await startWebServer();
    const started = webModeDirs();
    expect(started).toHaveLength(2);

    await closeFirst();
    const remaining = webModeDirs();
    expect(remaining).toHaveLength(1);
    expect(started).toContain(remaining[0]);
    expect(readdirSync(join(tmpdir(), remaining[0] ?? ''))).toContain(
      DATABASE_FILE,
    );

    await closeSecond();
    expect(webModeDirs()).toEqual([]);
  });

  it('hands the request handler a copy of the dev app data, not the installed release data, with the app version and the fixture images, and closes the copy on close', async () => {
    const { use, close } = await startServer('web');

    expect(createRequestHandler).toHaveBeenCalledTimes(1);
    const [[context]] = createRequestHandler.mock.calls;
    expect(use).toHaveBeenCalledWith(
      createRequestHandler.mock.results[0]?.value,
    );
    expect(await context.db.select('SELECT a FROM probe')).toEqual([
      { a: 'dev' },
    ]);
    expect(context.imagesDir.startsWith(tmpdir())).toBe(true);
    expect(readdirSync(context.imagesDir)).toEqual(['dev.png']);
    expect(context.version).toBe(
      readRepositoryJson('../package.json', z.object({ version: z.string() }))
        .version,
    );
    const fixturesDir = resolve(import.meta.dirname, '../fixtures/images');
    expect([...context.fixturePaths].sort()).toEqual(
      readdirSync(fixturesDir)
        .map((name) => join(fixturesDir, name))
        .sort(),
    );

    await close();
    await expect(context.db.select('SELECT 1')).rejects.toThrow(
      /^database is not open$/,
    );
  });

  it('in the seeded mode, hands the request handler a fresh database holding the seed and an images folder holding only the seed images, reading no app data', async () => {
    // Without any app data, so a seeded start that read the dev or release directory would fail.
    rmSync(join(home.dir, 'Library'), { recursive: true });
    vi.stubEnv('GM_TOOL_WEB_DATA', 'seed');
    const webServerConfig = await resolveConfig(
      {
        configFile: resolve(import.meta.dirname, '../../vite.config.ts'),
        mode: 'web',
      },
      'serve',
    );

    const { close } = await startServer('web', webServerConfig);

    const [[context]] = createRequestHandler.mock.calls;
    expect(
      await context.db.select('SELECT name FROM adventures ORDER BY name'),
    ).toEqual([{ name: 'Imageless Adventure' }, { name: 'Seed Adventure' }]);
    expect(context.imagesDir.startsWith(tmpdir())).toBe(true);
    // The seed's images land in the folder the request handler serves from.
    const seededImages = await context.db.select<
      { id: string; file_extension: string }[]
    >('SELECT id, file_extension FROM images');
    expect([...readdirSync(context.imagesDir)].sort()).toEqual(
      seededImages
        .map(({ id, file_extension }) => `${id}.${file_extension}`)
        .sort(),
    );
    await close();
    expect(webModeDirs()).toEqual([]);
  });

  it('in the seeded mode, hands the request handler an images folder that exists even when the seed saves no image', async () => {
    vi.stubEnv('GM_TOOL_WEB_DATA', 'seed');
    seedDatabase.mockImplementationOnce(() => Promise.resolve());
    const webServerConfig = await resolveConfig(
      {
        configFile: resolve(import.meta.dirname, '../../vite.config.ts'),
        mode: 'web',
      },
      'serve',
    );

    const { close } = await startServer('web', webServerConfig);

    const [[context]] = createRequestHandler.mock.calls;
    expect(readdirSync(context.imagesDir)).toEqual([]);
    await close();
  });

  it('refuses to start without the dev database, naming it, though the installed release data exists, and leaves no copy', async () => {
    rmSync(join(devDir, DATABASE_FILE));

    await expect(startWebServer()).rejects.toThrow(
      `No dev app data at ${join(devDir, DATABASE_FILE)}.`,
    );
    expect(webModeDirs()).toEqual([]);
  });

  it('copies nothing and registers no middleware when serving outside web mode', async () => {
    const { use } = await startServer('development');

    expect(use).not.toHaveBeenCalled();
    expect(webModeDirs()).toEqual([]);
  });

  it('closes without error when the server never started, and when its copy is already gone', async () => {
    const { close: closeIdle } = await startServer('development');
    await expect(closeIdle()).resolves.toBeUndefined();

    const close = await startWebServer();
    for (const name of webModeDirs()) {
      rmSync(join(tmpdir(), name), { recursive: true });
    }
    await expect(close()).resolves.toBeUndefined();
  });
});
