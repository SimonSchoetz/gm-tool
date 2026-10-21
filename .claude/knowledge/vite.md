# Vite

## Importing through a barrel file makes the Vite dev server fetch and transform every module the barrel re-exports; Vite recommends importing the individual module instead

**Verified at:** <https://vite.dev/guide/performance>, 2026-09-30
**Citation:** [architect_1: https://vite.dev/guide/performance]

The performance guide explains that every file behind a barrel must be fetched and transformed because any of them may have side effects that run on initialization, which slows dev-server page loads. Its example prefers `import { slash } from './utils/slash.js'` over `import { slash } from './utils'`.

## Vite 8.3.1 types `ViteDevServer.middlewares` as `Connect.Server`, whose `use(fn)` takes a `NextHandleFunction` `(req, res, next) => void` with `req` a `Connect.IncomingMessage` extending `http.IncomingMessage`, and types `configureServer` as returning `(() => void) | void | Promise<(() => void) | void>`

**Verified at:** vite 8.3.1, read 2026-10-20
**Citation:** [spec-writer_6: app/node_modules/vite/dist/node/index.d.ts:491-523 — `declare namespace Connect` with `IncomingMessage extends http.IncomingMessage { originalUrl?: … }`, `NextFunction = (err?: any) => void`, `NextHandleFunction = (req: IncomingMessage, res: http.ServerResponse, next: NextFunction) => void`, and `Server.use(fn: NextHandleFunction)` plus `use(route: string, fn: NextHandleFunction)`; :2036 — `middlewares: Connect.Server`; :2478 — `type ServerHook = (this: MinimalPluginContextWithoutEnvironment, server: ViteDevServer) => (() => void) | void | Promise<(() => void) | void>`; :3322-3327 — `ConfigEnv` with `command: "build" | "serve"` and `mode: string`]

A middleware handed to `server.middlewares.use` is declared to return `void`, so an `async` handler passed there trips `@typescript-eslint/no-misused-promises` under this project's `strictTypeChecked` config; a synchronous wrapper that starts the async work and attaches its own `.catch` satisfies the signature.

## Vite 8.3.1's default config loader bundles `vite.config.ts` together with the local TypeScript files it imports, lists them in `loadConfigFromFile`'s `dependencies`, lets them import `node:` built-ins and bare packages, and gives `import.meta.dirname` inside them the source file's directory

**Verified at:** vite 8.3.1, run 2026-10-20
**Citation:** [architect_3: ran a scratch `loadConfigFromFile({ command: 'serve', mode: 'web' })` on a `vite.config.ts` importing `./probePlugin.ts` with Vite 8.3.1 — observed `dependencies` listing both files, the plugin's `configResolved` running with `sqlite_version()` 3.53.4, `zod` parsing and `import.meta.dirname` equal to the probe directory; `resolveConfig(mode 'web', 'serve')` — observed `config.mode=web isProduction=false env.MODE=web env.DEV=true env.PROD=false`]

A plugin file beside `vite.config.ts` runs inside the config bundle with Node's built-ins (`node:sqlite` included) and the project's packages available, and `import.meta.dirname` resolves to that file's own directory rather than the temporary bundle's.

## Under Vite 8.3.1, `vite --mode web` (serve) resolves `config.mode = 'web'`, `isProduction = false`, `import.meta.env.MODE = 'web'`, `DEV = true`, `PROD = false`

**Verified at:** vite 8.3.1, run 2026-10-20
**Citation:** [architect_3: ran a scratch `loadConfigFromFile({ command: 'serve', mode: 'web' })` on a `vite.config.ts` importing `./probePlugin.ts` with Vite 8.3.1 — observed `dependencies` listing both files, the plugin's `configResolved` running with `sqlite_version()` 3.53.4, `zod` parsing and `import.meta.dirname` equal to the probe directory; `resolveConfig(mode 'web', 'serve')` — observed `config.mode=web isProduction=false env.MODE=web env.DEV=true env.PROD=false`] [architect_7: <https://vite.dev/guide/env-and-mode> — `--mode` overrides the command's default mode; `DEV` is the opposite of `PROD`, tied to `NODE_ENV`; `import.meta.env.*` is "statically replaced at build time to make tree-shaking effective"]

A mode name of the project's own choosing leaves the serve command's development flags as they are, so `import.meta.env.MODE === 'web'` tells the web dev server apart from `vite` and from `vite build` while `DEV` stays `true`.

## `configureServer` is an async, sequential hook returning `(() => void) | void | Promise<(() => void) | void>`, called before Vite's internal middlewares, and a function it returns runs after them

**Verified at:** <https://vite.dev/guide/api-plugin>, 2026-10-20
**Citation:** [architect_2: <https://vite.dev/guide/api-plugin> — "`(server: ViteDevServer) => (() => void) | void | Promise<(() => void) | void>`", kind "async, sequential"]

A middleware registered with `server.middlewares.use` inside the hook runs before Vite's own, so a path prefix it answers never reaches the SPA fallback, and Vite awaits a promise the hook returns before the server starts serving.

## Vite documents `import.meta.env.*` as statically replaced at build time to make tree-shaking effective, and `--mode` as overriding a command's default mode

**Verified at:** <https://vite.dev/guide/env-and-mode>, 2026-10-20; vite 8.3.1, run 2026-10-20
**Citation:** [architect_7: <https://vite.dev/guide/env-and-mode> — `--mode` overrides the command's default mode; `DEV` is the opposite of `PROD`, tied to `NODE_ENV`; `import.meta.env.*` is "statically replaced at build time to make tree-shaking effective"] [code-reviewer_1: ran `npx vite build --outDir <scratch> --emptyOutDir` from `app/` at 88bc6ddd, where `app/platform/index.ts` selects `webPlatform` under `import.meta.env.MODE === 'web'` — observed exit 0, neither `__dev-data` nor "dev data server is not reachable" in the output, and the control string `plugin:sql` present]

A production build drops a branch guarded by `import.meta.env.MODE === '<mode>'` when the build's mode differs, and the same source selects the other branch under `vite --mode <mode>`.

## Vite's CLI takes `-m, --mode <mode>`, `--port <port>` and `--strictPort`

**Verified at:** <https://vite.dev/guide/cli>, 2026-10-20
**Citation:** [architect_5: <https://vite.dev/guide/cli>]

A launch command can append `--mode` and `--port` to a package script that runs `vite`, and the script's own flags stay in force.

## Vite bundles its config file with Rolldown into a temporary file by default before loading it

**Verified at:** <https://vite.dev/config/>, 2026-10-20
**Citation:** [architect_34: <https://vite.dev/config/> — "By default, Vite uses Rolldown to bundle the config into a temporary file and load it"]

The config and the local files it imports run as one bundle, not as the project's own module graph, so what that bundle can resolve is decided by Rolldown's loader and not by the project's `tsconfig.json`.

## Vite 8.3.1's `closeServer` plugin hook runs once the dev server is torn down, with `reason` `'restart'` or `'close'`, and the CLI closes the server on `SIGTERM`

**Verified at:** vite 8.3.1 — 2026-10-21
**Citation:** [refine-1-follow-ups_5: `app/node_modules/vite/dist/node/index.d.ts:2265-2273` — "Run logic when the server is restarted or closed … The hooks are called after the server is torn down"] [refine-1-follow-ups_6: `app/node_modules/vite/dist/node/chunks/node.js:24675-24690` — `closeServer` closes the watcher, websocket, environments and HTTP server, then calls every plugin's `closeServer` hook with `{ reason }`; `:3081-3087` — `setupSIGTERMListener` registers `process.once("SIGTERM", …)` and, outside CI, `process.stdin.on("end", …)`]

A plugin that holds a resource per server start, such as a temp directory or an open database, releases it there.
