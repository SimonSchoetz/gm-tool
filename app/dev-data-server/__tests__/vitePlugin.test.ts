// @vitest-environment node
import { mkdirSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import type { ResolvedConfig, ViteDevServer } from 'vite';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { INSTALLED_DATABASE_FILE } from '../installedAppData';
import { readRepositoryJson, tauriConfigSchema } from '../repositoryJson';
import { devDataServer } from '../vitePlugin';
import { createTempDirectory } from './support/tempDirectory';

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

describe('devDataServer temp directory', () => {
  let home: ReturnType<typeof createTempDirectory>;

  const webModeDirs = () =>
    readdirSync(tmpdir()).filter((name) =>
      name.startsWith('gm-tool-web-mode-'),
    );

  const startWebServer = async () => {
    const plugin = devDataServer();
    const configResolved = plugin.configResolved as unknown as (
      config: ResolvedConfig,
    ) => void;
    configResolved({
      command: 'serve',
      mode: 'web',
      server: { host: false },
    } as unknown as ResolvedConfig);
    const configureServer = plugin.configureServer as unknown as (
      server: ViteDevServer,
    ) => Promise<void>;
    await configureServer({
      middlewares: { use: vi.fn() },
    } as unknown as ViteDevServer);
    return plugin.closeServer as unknown as () => Promise<void>;
  };

  beforeEach(() => {
    home = createTempDirectory();
    const { identifier } = readRepositoryJson(
      '../src-tauri/tauri.conf.json',
      tauriConfigSchema,
    );
    const installedDir = join(
      home.dir,
      'Library',
      'Application Support',
      identifier,
    );
    mkdirSync(installedDir, { recursive: true });
    new DatabaseSync(join(installedDir, INSTALLED_DATABASE_FILE)).close();
    vi.stubEnv('HOME', home.dir);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    home.remove();
  });

  it('gives each server start its own copy, and closing one server removes only its copy', async () => {
    const before = new Set(webModeDirs());

    const closeFirst = await startWebServer();
    const closeSecond = await startWebServer();
    const started = webModeDirs().filter((name) => !before.has(name));
    expect(started).toHaveLength(2);

    await closeFirst();
    const remaining = webModeDirs().filter((name) => !before.has(name));
    expect(remaining).toHaveLength(1);
    expect(started).toContain(remaining[0]);
    expect(readdirSync(join(tmpdir(), remaining[0] ?? ''))).toContain(
      INSTALLED_DATABASE_FILE,
    );

    await closeSecond();
    expect(webModeDirs().filter((name) => !before.has(name))).toEqual([]);
  });
});
