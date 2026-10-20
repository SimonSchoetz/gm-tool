# Vite

## Importing through a barrel file makes the Vite dev server fetch and transform every module the barrel re-exports; Vite recommends importing the individual module instead

**Verified at:** https://vite.dev/guide/performance, 2026-09-30
**Citation:** [architect_1: https://vite.dev/guide/performance]

The performance guide explains that every file behind a barrel must be fetched and transformed because any of them may have side effects that run on initialization, which slows dev-server page loads. Its example prefers `import { slash } from './utils/slash.js'` over `import { slash } from './utils'`.

## Vite 8.3.1 types `ViteDevServer.middlewares` as `Connect.Server`, whose `use(fn)` takes a `NextHandleFunction` `(req, res, next) => void` with `req` a `Connect.IncomingMessage` extending `http.IncomingMessage`, and types `configureServer` as returning `(() => void) | void | Promise<(() => void) | void>`

**Verified at:** vite 8.3.1, read 2026-10-20
**Citation:** [spec-writer_6: app/node_modules/vite/dist/node/index.d.ts:491-523 — `declare namespace Connect` with `IncomingMessage extends http.IncomingMessage { originalUrl?: … }`, `NextFunction = (err?: any) => void`, `NextHandleFunction = (req: IncomingMessage, res: http.ServerResponse, next: NextFunction) => void`, and `Server.use(fn: NextHandleFunction)` plus `use(route: string, fn: NextHandleFunction)`; :2036 — `middlewares: Connect.Server`; :2478 — `type ServerHook = (this: MinimalPluginContextWithoutEnvironment, server: ViteDevServer) => (() => void) | void | Promise<(() => void) | void>`; :3322-3327 — `ConfigEnv` with `command: "build" | "serve"` and `mode: string`]

A middleware handed to `server.middlewares.use` is declared to return `void`, so an `async` handler passed there trips `@typescript-eslint/no-misused-promises` under this project's `strictTypeChecked` config; a synchronous wrapper that starts the async work and attaches its own `.catch` satisfies the signature.
