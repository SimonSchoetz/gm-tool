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

## Vitest 5 throws at transform time on a `vi.mock` or `vi.hoisted` call that is not at the module's top level

**Verified at:** vitest 5.0.1 (@vitest/mocker 5.0.1)
**Citation:** [spec-writer_51: app/node_modules/.pnpm/@vitest+mocker@5.0.1_vite@8.3.0_@types+node@26.6.1_jiti@2.7.0_/node_modules/@vitest/mocker/dist/chunk-hoistMocks.js:631-660 — "validate that hoisted nodes are defined on the top level" … `throw new Error(message)` naming calls "defined outside of the module's top level scope"]

A helper function that calls `vi.mock` cannot be shared between test files; each file declares its mocks at top level, and a factory can still `await import()` shared setup code.

## Vitest 5 clears every mock's call history before each test by default

**Verified at:** vitest 5.0.1
**Citation:** [spec-writer_52: app/node_modules/vitest/dist/chunks/defaults.D2ip7f-X.js:57 — `clearMocks: true`]

Calls recorded in a setup file, at module top level or in `beforeAll` are gone by the time a test runs; implementations set with `mockImplementation` are kept.

## A test file's `vi.mock` overrides a `setupFiles` mock of the same module only when both specifiers resolve to the same file

**Verified at:** vitest 5.0.1, run 2026-09-19
**Citation:** [harness-probe_25: ran a debug probe from a directory outside `app/` — observed the test's own import getting the test factory while `app/db/database.ts` got the setup file's mock] [harness-probe_27: ran the same probe with a `node_modules/@tauri-apps/plugin-sql` symlink making the bare specifier resolve to the app's package — observed the test factory reaching `database.ts`]

Inside `app/`, a test file's `vi.mock('@tauri-apps/plugin-sql', factory)` replaces the global mock in `app/src/__tests__/setup.ts` for every importer, because both resolve to the same installed package.

## Vitest 5 fails a test whose `.resolves`, `.rejects` or `toMatchFileSnapshot` assertion is not awaited

**Verified at:** vitest 5.0.1, <https://github.com/vitest-dev/vitest/blob/v5.0.1/docs/guide/migration/index.md> fetched 2026-09-19
**Citation:** [spec-writer_9: https://github.com/vitest-dev/vitest/blob/v5.0.1/docs/guide/migration/index.md, lines 349-362 — "Unawaited Asynchronous Assertions Fail the Test"]

Vitest 4 auto-awaited such an assertion at the end of the test and only printed a warning; Vitest 5 fails the test and points the error at the unawaited assertion. Every `expect(...).rejects`/`.resolves` in a test body needs `await`.

## Vitest collects only files matching `**/*.{test,spec}.?(c|m)[jt]s?(x)` by default

**Verified at:** vitest 5.0.1
**Citation:** [spec-writer_3: app/node_modules/vitest/dist/chunks/defaults.D2ip7f-X.js:5 — `const defaultInclude = ["**/*.{test,spec}.?(c|m)[jt]s?(x)"]`]

A support module under `__tests__/` whose name has no `.test` or `.spec` segment is never run as a test file, so shared test helpers can live beside the tests that import them.
