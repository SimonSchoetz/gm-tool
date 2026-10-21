// @vitest-environment node
import type { ResolvedConfig } from 'vite';
import { describe, expect, it } from 'vitest';
import { devDataServer } from '../vitePlugin';

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
