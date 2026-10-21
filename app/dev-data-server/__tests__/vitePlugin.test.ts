// @vitest-environment node
import { mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import type { ResolvedConfig, ViteDevServer } from 'vite';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { DATABASE_FILE } from '../../domain/database';
import { readRepositoryJson, tauriConfigSchema } from '../repositoryJson';
import type { createRequestHandler as createRequestHandlerType } from '../requestHandler';
import { devDataServer } from '../vitePlugin';
import { createTempDirectory } from './support/tempDirectory';

// The context the plugin computes for the request handler is its outcome; the handler itself has its own tests.
const createRequestHandler = vi.hoisted(() =>
  vi.fn<typeof createRequestHandlerType>(() => () => undefined),
);
vi.mock('../requestHandler', () => ({ createRequestHandler }));

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
      /^The dev data server serves the installed app's data, so server\.host must be false or 'localhost'; it is true — remove --host or set it to localhost\.$/,
    );
    expect(() => {
      runConfigResolved(resolvedConfig('serve', 'web', '0.0.0.0'));
    }).toThrow(
      /^The dev data server serves the installed app's data, so server\.host must be false or 'localhost'; it is 0\.0\.0\.0 — remove --host or set it to localhost\.$/,
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
  let installedDir: string;

  const webModeDirs = () =>
    readdirSync(tmpdir()).filter((name) =>
      name.startsWith('gm-tool-web-mode-'),
    );

  const startServer = async (mode: string) => {
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
    } as unknown as ViteDevServer);
    return {
      use,
      close: plugin.closeServer as unknown as () => Promise<void>,
    };
  };

  const startWebServer = async () => (await startServer('web')).close;

  beforeEach(() => {
    createRequestHandler.mockClear();
    home = createTempDirectory();
    const { identifier } = readRepositoryJson(
      '../src-tauri/tauri.conf.json',
      tauriConfigSchema,
    );
    installedDir = join(home.dir, 'Library', 'Application Support', identifier);
    mkdirSync(join(installedDir, 'images'), { recursive: true });
    const installed = new DatabaseSync(join(installedDir, DATABASE_FILE));
    installed.exec(
      "CREATE TABLE probe (a TEXT); INSERT INTO probe (a) VALUES ('installed')",
    );
    installed.close();
    writeFileSync(join(installedDir, 'images', 'installed.png'), 'png');
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

  it('hands the request handler the copy of the installed data, the app version and the fixture images, and closes the copy on close', async () => {
    const { use, close } = await startServer('web');

    expect(createRequestHandler).toHaveBeenCalledTimes(1);
    const [[context]] = createRequestHandler.mock.calls;
    expect(use).toHaveBeenCalledWith(
      createRequestHandler.mock.results[0]?.value,
    );
    expect(await context.db.select('SELECT a FROM probe')).toEqual([
      { a: 'installed' },
    ]);
    expect(context.imagesDir.startsWith(tmpdir())).toBe(true);
    expect(readdirSync(context.imagesDir)).toEqual(['installed.png']);
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

  it('refuses to start without the installed database, naming it, and leaves no copy', async () => {
    rmSync(join(installedDir, DATABASE_FILE));

    await expect(startWebServer()).rejects.toThrow(
      /^No installed app data at .+ before running web mode\.$/,
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
