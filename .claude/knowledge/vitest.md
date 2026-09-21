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

**Verified at:** vitest 5.0.1, run 2026-09-19
**Citation:** [review_3: ran `npx vitest run services/__tests__/zz-probe.test.ts` from a scratch export of `a5ec893b`'s `app/` with `app/node_modules` linked (vitest 5.0.1) — observed a statically imported module's counter read 2 in the second test with `vi.resetModules()` in `afterEach`, and a dynamic `import()` after `vi.resetModules()` in `beforeEach` read 1 in both tests]

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

## `await expect(promise).rejects.toMatchObject({ name })` matches an Error whose `name` was assigned after construction and fails on a plain `Error`

**Verified at:** vitest 5.0.1, run 2026-09-19
**Citation:** [spec-writer_59: ran `npx vitest run services/__tests__/zz-scratch-probe.test.ts` from `app/` on a scratch test — observed `rejects.toMatchObject({ name: 'SyncApplyError' })` pass on an error made by a factory that sets `error.name` after `new Error(...)`, and `expect(Promise.reject(new Error('raw'))).rejects.toMatchObject({ name: 'SyncApplyError' })` throw]

An error type identified only by its `name` can be asserted without `instanceof`, and the assertion separates a wrapped typed error from a raw one, whose `name` is `'Error'`.

## A `vi.mock` factory returning `vi.hoisted` spies gives every module instance imported after `vi.resetModules()` the same spy objects

**Verified at:** vitest 5.0.1, run 2026-09-19
**Citation:** [spec-writer_60: ran `npx vitest run services/__tests__/zz-scratch-probe.test.ts` from `app/` on a scratch test with four top-level `vi.mock` factories returning `vi.hoisted` spies, `vi.resetModules()` in `beforeEach` and `await import('../syncService')` in each test — observed seven tests pass, each asserting on the hoisted spies its freshly imported module had called]

Spies configured before the dynamic `import()` are the ones the fresh module instance calls.

## A `mockResolvedValue` set in `beforeEach` replaces the `mockRejectedValue` an earlier test left on the same `vi.hoisted` spy

**Verified at:** vitest 5.0.1, run 2026-09-19
**Citation:** [spec-writer_60: ran `npx vitest run services/__tests__/zz-scratch-probe.test.ts` from `app/` on a scratch test with `vi.hoisted` spies behind top-level `vi.mock` factories and `vi.resetModules()` in `beforeEach` — observed a `mockResolvedValue` set in `beforeEach` replace the `mockRejectedValue` a previous test had left on the same spy]

A rejection one test sets on a spy does not carry into a later test whose `beforeEach` sets a resolved value again.

## `vi.fn<typeof ns.fn>()` declared through a type-only namespace import (`import type * as ns`) compiles, lints clean, and types both the `mockImplementation` callback parameters and its return value from the real function

**Verified at:** vitest 5.0.1, typescript 6.0.3, typescript-eslint 8.70.0, run 2026-09-19
**Citation:** [spec-writer_61: ran `npx tsc --noEmit` and `npx eslint services/__tests__/zz-scratch-probe.test.ts` from `app/` on a scratch test declaring `vi.hoisted(() => vi.fn<typeof syncDb.applyUpsert>())` under `import type * as syncDb from '@db/_sync'` with `mockImplementation((table, row) => …)` callbacks — observed both report no findings under `strict`, so the callback parameters were contextually typed] [review_4: ran `npx tsc --noEmit -p tsconfig.json` from a scratch export of `a5ec893b`'s `app/` on a scratch test declaring `vi.fn<typeof syncDb.applyUpsert>()` under `import type * as syncDb from '@db/_sync'` — observed TS2322 `Type 'Promise<"bogus">' is not assignable to type 'Promise<ApplyResult>'` for `mockImplementation(() => Promise.resolve('bogus'))` and no diagnostic for `Promise.resolve('applied')` or a conditional `'skipped' | 'applied'`]

A result type that a module's barrel does not export, such as `'applied' | 'skipped'`, is therefore reachable from a test without re-declaring it or importing from a path below the barrel.

## `expect.any(Boolean)` written as a direct argument of `toHaveBeenCalledWith`, or as an element inside a `toEqual` array literal, passes `tsc` and `eslint` without a cast

**Verified at:** vitest 5.0.1, typescript 6.0.3, typescript-eslint 8.70.0, run 2026-09-19
**Citation:** [spec-writer_62: ran `npx tsc --noEmit` and `npx eslint services/__tests__/zz-scratch-any.test.ts` from `app/` on a scratch test calling `expect(spy).toHaveBeenCalledWith('adventures', { id: 'a' }, expect.any(Boolean))` and `expect(spy.mock.calls).toEqual([['adventures', { id: 'a' }, expect.any(Boolean)]])` — observed no findings from either]

The matcher needs no `as` cast in those two positions.

## `vi.resetModules()` clears only the module cache and does not reset the mock registry or any spy's state

**Verified at:** vitest 5.0.1
**Citation:** [refine-claude_1: app/node_modules/vitest/dist/index.d.ts:814-817 — "Resets modules registry by clearing the cache of all modules … This method does not reset mocks registry."]

A `vi.hoisted` spy keeps whatever implementation or resolved value the previous test left on it after `vi.resetModules()` runs, so a test file that resets modules re-arms each spy's default in the same `beforeEach`.
