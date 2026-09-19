# Vitest

## Importing `node:sqlite` fails under the jsdom environment; a first-line `// @vitest-environment node` docblock overrides the configured environment and makes it work

**Verified at:** vitest 5.0.1, vite 8.3.0, Node v22.23.2, run 2026-09-19
**Citation:** [dependency-update_5: ran `npx vitest run` from `app/` on a scratch test importing `node:sqlite` — without the docblock under the config's `environment: 'jsdom'` observed `Cannot bundle Node.js built-in "node:sqlite"`; with `// @vitest-environment node` on the first line the test passed both under that config and with `--environment jsdom`] [dependency-update_6: ran `npx vitest run` on a scratch test with the docblock that imports `@tauri-apps/plugin-sql` — observed `vi.isMockFunction(Database.load)` true, so the config's `setupFiles` entry `app/src/__tests__/setup.ts` (which mocks that module) ran in the file]

The per-file docblock takes precedence over the config's `environment`, and the config's `setupFiles` still run in that file. A test that needs a Node built-in without a browser shim can therefore opt out of a global jsdom environment on its own.

## Inside Vitest, `import.meta.env.TEST` is the string `'true'` and `import.meta.env.DEV` is `true`; under the node environment `window` is undefined

**Verified at:** vitest 5.0.1, run 2026-09-19
**Citation:** [dependency-update_7: ran `npx vitest run` from `app/` on a scratch test with `// @vitest-environment node` asserting `toEqual({ dev: true, test: 'true', hasWindow: false })` on `{ dev: import.meta.env.DEV, test: import.meta.env.TEST, hasWindow: typeof window !== 'undefined' }` — observed the test pass]

`TEST` is a truthy string, not a boolean, so it works in a condition but fails a strict `=== true` comparison. A guard such as `import.meta.env.DEV && !import.meta.env.TEST && … window …` short-circuits before touching `window` in a node-environment test.

## `vi.resetModules()` does not re-evaluate a module already bound by a static top-level import; only a later dynamic `import()` gets a fresh instance

**Verified at:** vitest 4.1.11 (installed), <https://vitest.dev/api/vi> + run 2026-09-19
**Citation:** [head-of-instructions_1: web fetch https://vitest.dev/api/vi — resetModules does not re-evaluate top-level static imports; a dynamic import after the reset is required] [refine-claude_1: ran `npx vitest run db/base-entity-content-section/__tests__/create.test.ts -t "includes name when provided"` from `app/`, a file with a static import and `afterEach(vi.resetModules)` — observed `mockExecute.mock.calls[0]` holding the init path's `CREATE TABLE IF NOT EXISTS _migrations` instead of the INSERT under test]

A statically imported module keeps its module-level state (such as a cached database handle) for the whole test file even when `vi.resetModules()` runs between tests, so the state depends on which test ran first. Resetting per test requires `vi.resetModules()` in `beforeEach` followed by `await import(...)` inside each test.
