import { resolve } from 'node:path';
import { resolveConfig, type ResolvedConfig } from 'vite';

// The web server's config as `vite --mode web` resolves it, so a seed server started from it gets the project's real aliases.
export const resolveWebServerConfig = (): Promise<ResolvedConfig> =>
  resolveConfig(
    {
      configFile: resolve(import.meta.dirname, '../../../vite.config.ts'),
      mode: 'web',
    },
    'serve',
  );
