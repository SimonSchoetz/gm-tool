// Node host — bundled into Vite's config with vitePlugin.ts. The seed calls the app's own services, whose imports go through the project's path aliases, which the config bundle cannot resolve, so it runs in a Vite server of its own: that server resolves the aliases the web server's config holds, with `@platform` pointed at seed/seedPlatform.ts, which answers from the given database, images folder and fixture images, and is closed once the seed has run.
import { join, resolve } from 'node:path';
import { createServer, type ResolvedConfig } from 'vite';
import type { runSeed } from './seed/seed.ts';
import type { CommandContext } from './commands.ts';

export const seedDatabase = async (
  context: CommandContext,
  webServerConfig: ResolvedConfig,
): Promise<void> => {
  const seedServer = await createServer({
    configFile: false,
    root: webServerConfig.root,
    // A cache folder of its own: in the web server's, the two servers' differing configs make each start re-optimize the other's dependencies.
    cacheDir: join(webServerConfig.cacheDir, 'seed-server'),
    resolve: {
      // The first matching alias wins, so this entry shadows the config's own `@platform`.
      alias: [
        {
          find: '@platform',
          replacement: resolve(import.meta.dirname, 'seed/seedPlatform.ts'),
        },
        ...webServerConfig.resolve.alias,
      ],
    },
    // The seed server is never listened on and is closed as soon as the seed has run, so these only keep it from opening an HTTP server, a WebSocket server and a file watcher meanwhile; a test could see them only through a fixed port or OS file handles, state app/CLAUDE.md — Testing keeps tests from reading.
    // Stryker disable next-line ObjectLiteral,BooleanLiteral: see the comment above.
    server: { middlewareMode: true, hmr: false, ws: false, watch: null },
  });
  try {
    const seedModule = (await seedServer.ssrLoadModule(
      resolve(import.meta.dirname, 'seed/seed.ts'),
    )) as { runSeed: typeof runSeed };
    await seedModule.runSeed(context);
  } finally {
    await seedServer.close();
  }
};
