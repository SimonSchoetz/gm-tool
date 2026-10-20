# Vitest

## Under the jsdom environment, a test file with no docblock imports `node:sqlite` when Vitest runs on Node v24.21.0 and fails to on Node v22.23.2

**Verified at:** vitest 5.0.2, vite 8.3.1, Node v24.21.0 and v22.23.2, run 2026-10-20
**Citation:** [instruction-pass_3: ran Vitest from `app/` on a scratch test importing `node:sqlite` with no docblock, under the config's `environment: 'jsdom'` — observed it pass on Node v24.21.0, with `typeof window` `'object'` and `SELECT 1 AS one` through `DatabaseSync` returning `{ one: 1 }`, and fail on Node v22.23.2 with `Cannot bundle Node.js built-in "node:sqlite"`]

With vitest and vite unchanged, the Node version that ran Vitest decided the outcome.

## A first-line `// @vitest-environment node` docblock overrides the configured jsdom environment, and the config's `setupFiles` still run in that file

**Verified at:** vitest 5.0.2, vite 8.3.1, Node v24.21.0 and v22.23.2, run 2026-10-20
**Citation:** [instruction-pass_4: ran Vitest from `app/` on a scratch test with `// @vitest-environment node` on the first line that imports `node:sqlite` and `@tauri-apps/plugin-sql` and has no `vi.mock` of its own — observed it pass on Node v22.23.2 under the config, and on Node v24.21.0 both under the config and with `--environment jsdom`, its assertions that `typeof window` is `'undefined'` and that `vi.isMockFunction(Database.load)` is true included, so the config's `setupFiles` entry `app/src/__tests__/setup.ts`, which mocks that module, ran in the file]

With the docblock a file imports `node:sqlite` on both Node versions, and on Node v24.21.0 the docblock also wins over `--environment jsdom` on the command line.

## Inside Vitest, `import.meta.env.TEST` is the string `'true'` and `import.meta.env.DEV` is `true`; under the node environment `window` is undefined

**Verified at:** vitest 5.0.2, run 2026-10-20
**Citation:** [instruction-pass_5: ran Vitest from `app/` on Node v24.21.0 on a scratch test with `// @vitest-environment node` asserting `dev: true`, `test: 'true'` and `hasWindow: false` on `{ dev: import.meta.env.DEV, test: import.meta.env.TEST, hasWindow: typeof window !== 'undefined' }` — observed the test pass] [instruction-pass_25: ran Vitest from `app/` on Node v24.21.0 on a scratch test with no docblock, under the config's `environment: 'jsdom'`, asserting `toEqual({ dev: true, test: 'true', hasWindow: true })` on the same object — observed the test pass]

`TEST` is a truthy string, not a boolean, so it works in a condition but fails a strict `=== true` comparison. A guard such as `import.meta.env.DEV && !import.meta.env.TEST && … window …` short-circuits before touching `window` in a node-environment test.

## `vi.resetModules()` does not re-evaluate a module already bound by a static top-level import; only a later dynamic `import()` gets a fresh instance

**Verified at:** vitest 5.0.2, run 2026-10-20
**Citation:** [instruction-pass_6: ran Vitest from `app/` on two scratch test files incrementing a module-level counter — observed the counter read 2 in the second test when the module was statically imported and `vi.resetModules()` ran in `afterEach`, and 1 in both tests when each test loaded it with `await import()` after `vi.resetModules()` ran in `beforeEach`]

A statically imported module keeps its module-level state (such as a cached database handle) for the whole test file even when `vi.resetModules()` runs between tests, so the state depends on which test ran first. Resetting per test works with `vi.resetModules()` in `beforeEach` followed by `await import(...)` inside each test.

## Vitest 5 throws at transform time on a `vi.mock` or `vi.hoisted` call that is not at the module's top level

**Verified at:** vitest 5.0.2 (@vitest/mocker 5.0.2), read and run 2026-10-20
**Citation:** [instruction-pass_7: app/node_modules/.pnpm/@vitest+mocker@5.0.2_vite@8.3.1_@types+node@26.6.3_jiti@2.7.0_/node_modules/@vitest/mocker/dist/chunk-hoistMocks.js:631-660 — "validate that hoisted nodes are defined on the top level" … `throw new Error(message)` naming calls "defined outside of the module's top level scope"] [instruction-pass_28: ran `npx vitest run` from `app/` as of 2bb99ae1 — observed all 162 test files pass, `app/db/adventure/__tests__/create.test.ts` among them, whose top-level `vi.mock('@tauri-apps/plugin-sql', async () => …)` factory runs `await import('@db/__tests__/support/sqlite-test-database')`]

A helper function that calls `vi.mock` cannot be shared between test files; each file declares its mocks at top level, and a factory can still `await import()` shared setup code.

## Vitest 5 clears every mock's call history before each test by default

**Verified at:** vitest 5.0.2, read and run 2026-10-20
**Citation:** [instruction-pass_8: app/node_modules/vitest/dist/chunks/defaults.D2ip7f-X.js:57 — `clearMocks: true`] [instruction-pass_9: ran Vitest from `app/` on a scratch test whose `vi.fn` was called at module top level and in `beforeAll` — observed `mock.calls` empty in the first test, empty again in the second after the first had called it, and the `mockImplementation` the first test set still returned in the second]

Calls recorded at module top level or in `beforeAll` are gone by the time a test runs; an implementation a test sets with `mockImplementation` is kept.

## A test file's `vi.mock` overrides a `setupFiles` mock of the same module only when both specifiers resolve to the same file

**Verified at:** vitest 5.0.2, run 2026-10-20
**Citation:** [instruction-pass_10: ran Vitest from `app/` on a scratch test whose `vi.mock('@tauri-apps/plugin-sql', factory)` returns a marker — observed the marker reach a scratch module under `app/` that imports the same specifier] [instruction-pass_11: ran Vitest with `--root` at a scratch directory outside `app/` and `app/src/__tests__/setup.ts` as its setup file — observed the test's own import get the test factory's marker while a module under `app/` importing the same specifier got the setup file's `vi.fn()`; with a `node_modules/@tauri-apps/plugin-sql` symlink to the app's package in that directory, observed the marker reach the module under `app/`]

Inside `app/`, a test file's `vi.mock('@tauri-apps/plugin-sql', factory)` replaces the global mock in `app/src/__tests__/setup.ts` for every importer, because both resolve to the same installed package.

## Vitest 5 fails a test whose `.resolves`, `.rejects` or `toMatchFileSnapshot` assertion is not awaited

**Verified at:** vitest 5.0.2, <https://raw.githubusercontent.com/vitest-dev/vitest/v5.0.2/docs/guide/migration/index.md> fetched 2026-10-20, run 2026-10-20
**Citation:** [instruction-pass_12: <https://raw.githubusercontent.com/vitest-dev/vitest/v5.0.2/docs/guide/migration/index.md>, lines 349-362, under line 6's `# Migrating to Vitest 5.0` — "Unawaited Asynchronous Assertions Fail the Test": "Asynchronous assertions, like `resolves`, `rejects` and `toMatchFileSnapshot`, now fail the test if they are not awaited. Previously, Vitest auto-awaited them at the end of the test and printed a warning"] [instruction-pass_13: ran Vitest from `app/` on a scratch test with an unawaited `.rejects.toThrow` and one with an unawaited `.resolves.toBe` — observed both fail with "Promise returned by `expect(actual).rejects.toThrow(expected)` was not awaited" and its `.resolves.toBe` counterpart, each error pointing at the assertion's line]

Vitest 4 auto-awaited such an assertion at the end of the test and only printed a warning; Vitest 5 fails the test and points the error at the unawaited assertion. Every `expect(...).rejects`/`.resolves` in a test body needs `await`.

## Vitest collects only files matching `**/*.{test,spec}.?(c|m)[jt]s?(x)` by default

**Verified at:** vitest 5.0.2
**Citation:** [instruction-pass_14: app/node_modules/vitest/dist/chunks/defaults.D2ip7f-X.js:5 — `const defaultInclude = ["**/*.{test,spec}.?(c|m)[jt]s?(x)"]`]

Under that default, a support module under `__tests__/` whose name has no `.test` or `.spec` segment is never run as a test file, so shared test helpers can live beside the tests that import them.

## `await expect(promise).rejects.toMatchObject({ name })` matches an Error whose `name` was assigned after construction and fails on a plain `Error`

**Verified at:** vitest 5.0.2, run 2026-10-20
**Citation:** [instruction-pass_15: ran Vitest from `app/` on a scratch test — observed `rejects.toMatchObject({ name: 'SyncApplyError' })` pass on an error made by a factory that sets `error.name` after `new Error(...)`, and the same assertion fail on `Promise.reject(new Error('raw'))`]

An error type identified only by its `name` can be asserted without `instanceof`, and the assertion separates a wrapped typed error from a raw one, whose `name` is `'Error'`.

## A `vi.mock` factory returning `vi.hoisted` spies gives every module instance imported after `vi.resetModules()` the same spy objects

**Verified at:** vitest 5.0.2, run 2026-10-20
**Citation:** [instruction-pass_16: ran Vitest from `app/` on a scratch test with a `vi.hoisted` spy behind a top-level `vi.mock` factory, `vi.resetModules()` and `mockResolvedValue` in `beforeEach`, and `await import()` of a module calling the spy in each test — observed the second test's module instance differ from the first's, by a module-level object compared across tests, and the hoisted spy record that instance's call]

Spies configured before the dynamic `import()` are the ones the fresh module instance calls.

## A `mockResolvedValue` set in `beforeEach` replaces the `mockRejectedValue` an earlier test left on the same `vi.hoisted` spy

**Verified at:** vitest 5.0.2, run 2026-10-20
**Citation:** [instruction-pass_16: ran Vitest from `app/` on a scratch test with a `vi.hoisted` spy behind a top-level `vi.mock` factory, `vi.resetModules()` and `mockResolvedValue` in `beforeEach`, and `await import()` of a module calling the spy in each test — observed the `mockRejectedValue` the first test set on the spy replaced in the second by the `mockResolvedValue` from `beforeEach`, the second test's call resolving]

A rejection one test sets on a spy does not carry into a later test whose `beforeEach` sets a resolved value again.

## `vi.fn<typeof ns.fn>()` declared through a type-only namespace import (`import type * as ns`) compiles, lints clean, and types both the `mockImplementation` callback parameters and its return value from the real function

**Verified at:** vitest 5.0.2, typescript 6.0.3, typescript-eslint 8.71.0, run 2026-10-20
**Citation:** [instruction-pass_17: ran `npx tsc --noEmit` and `npx eslint` from `app/` on a scratch test declaring `vi.hoisted(() => vi.fn<typeof dep.applyThing>())` under `import type * as dep` of a scratch module whose `applyThing` takes `(table: string, row: { id: string })` and returns `Promise<'applied' | 'skipped'>`, with a `mockImplementation((table, row) => …)` callback returning that conditional — observed no findings from either under `strict`, so the callback parameters were contextually typed] [instruction-pass_18: ran `npx tsc --noEmit` from `app/` on a second scratch test with the same declaration — observed TS2322 `Type 'Promise<"bogus">' is not assignable to type 'Promise<"applied" | "skipped">'` for `mockImplementation(() => Promise.resolve('bogus'))`] [instruction-pass_27: ran `npx tsc --noEmit` and `npx eslint .` from `app/` as of 2bb99ae1 — observed no findings, `app/services/__tests__/syncService.test.ts` included, which declares `vi.hoisted(() => vi.fn<typeof syncDb.applyUpsert>())` under `import type * as syncDb from '@db/_sync'` and passes `mockImplementation((_table, row) => …)` callbacks] [instruction-pass_29: grep `ApplyResult` app/db/_sync/index.ts — not found; app/db/_sync/types.ts:1 — `export type ApplyResult = 'applied' | 'skipped'`; app/db/_sync/apply-upsert.ts:93 — `applyUpsert` returns `Promise<ApplyResult>` — as of 2bb99ae1]

A result type that a module's barrel does not export, such as `'applied' | 'skipped'`, is therefore reachable from a test without re-declaring it or importing from a path below the barrel.

## `expect.any(Boolean)` written as a direct argument of `toHaveBeenCalledWith`, or as an element inside a `toEqual` array literal, passes `tsc` and `eslint` without a cast

**Verified at:** vitest 5.0.2, typescript 6.0.3, typescript-eslint 8.71.0, run 2026-10-20
**Citation:** [instruction-pass_19: ran `npx tsc --noEmit` and `npx eslint` from `app/` on a scratch test calling `expect(spy).toHaveBeenCalledWith('t', { id: 'r' }, expect.any(Boolean))` and `expect(spy.mock.calls).toEqual([['t', { id: 'r' }, expect.any(Boolean)]])` — observed no findings from either, and both assertions pass]

The matcher needs no `as` cast in those two positions.

## `vi.resetModules()` clears the module cache and does not reset the mock registry or a spy's implementation

**Verified at:** vitest 5.0.2, read and run 2026-10-20
**Citation:** [instruction-pass_20: app/node_modules/vitest/dist/index.d.ts:814-817 — "Resets modules registry by clearing the cache of all modules … This method does not reset mocks registry."] [instruction-pass_26: ran Vitest from `app/` on a scratch test with a `vi.hoisted` spy behind a top-level `vi.mock` factory and `vi.resetModules()` in `beforeEach` — observed a `mockReturnValue` set in the first test still returned by the module the second test imported with `await import()`]

A `vi.hoisted` spy keeps whatever implementation the previous test set on it, such as a `mockReturnValue`, after `vi.resetModules()` runs, so a test file that resets modules re-arms each spy's default in the same `beforeEach`.

## Under `vi.useFakeTimers()`, `await act(() => vi.advanceTimersByTimeAsync(ms))` settles a TanStack Query query and a debounced mutation rendered with `renderHook`

**Verified at:** vitest 5.0.2, @testing-library/react 16.3.3, @tanstack/react-query 5.104.0, read and run 2026-10-20
**Citation:** [instruction-pass_21: app/node_modules/vitest/dist/index.d.ts:466-468 — `advanceTimersByTimeAsync`: "This will include and await asynchronously set timers."] [instruction-pass_22: ran Vitest from `app/` on a scratch test rendering `useSession` with `renderHook` under a `QueryClientProvider`, with `vi.useFakeTimers()` and a mocked `@services/sessionService` — observed the hook's session present after `await act(() => vi.advanceTimersByTimeAsync(0))` and `'jest' in globalThis` false; after an edit, a re-render with other ids and `await act(() => vi.advanceTimersByTimeAsync(AUTOSAVE_DELAY_MS))`, the mocked update called once with the scheduled id and data and `invalidateQueries` called with the scheduled keys; in a control test with no advance, the session `null` and the update not called]

The async variant also runs timers set while promises resolve during the advanced window, so a query's fetch, a debounced save's timer and the mutation it dispatches, `onSuccess` included, all complete without `waitFor`. Vitest defines no `jest` global, so Testing Library's `waitFor` does not work under these timers (`.claude/knowledge/testing-library.md`).

## Under `vi.useFakeTimers()`, `await act(() => vi.runOnlyPendingTimersAsync())` fires a pending deferred save's timer, and the mutation that timer dispatches reaches its service call, in a component rendered with `render`

**Verified at:** vitest 5.0.2, @testing-library/react 16.3.3, @tanstack/react-query 5.104.0, read and run 2026-10-20
**Citation:** [instruction-pass_23: ran `npx vitest run` from `app/` on `app/src/components/UploadImgBtn/components/ImageViewerDialog/components/ImagePreviewFramingOverlay/__tests__/ImagePreviewFramingOverlay.test.tsx` as of 2bb99ae1, which renders the overlay under `TanstackQueryClientProvider` with a mocked `@services/imageService`, dispatches `fireEvent.wheel`, then runs `await act(() => vi.runOnlyPendingTimersAsync())` — observed it pass, the mocked `updateImageFrame` called once with the zoomed frame, and a scratch copy without that `runOnlyPendingTimersAsync` line fail with `expected "vi.fn()" to be called 1 times, but got 0 times`] [instruction-pass_24: app/node_modules/vitest/dist/index.d.ts:442-446 — `runOnlyPendingTimersAsync` "will asynchronously call every timer that was initiated after `vi.useFakeTimers` call, even asynchronous ones. It will not fire any timer that was initiated during its call."]

It fires every timer already pending when it is called and none that starts during the call, so a test waits out a deferred save without knowing its delay.

## A `vi.mock` factory's missing export throws `No "<name>" export is defined on the "<module>" mock` when the export is read, not when the mocked module is imported

**Verified at:** vitest 5.0.2, run 2026-10-20
**Citation:** [spec-writer_1: ran a scratch `// @vitest-environment node` test under `npx vitest run` from `app/` with `vi.mock('@tauri-apps/api/core', () => ({ invoke: vi.fn(() => Promise.resolve('ok')) }))` and a module importing `{ invoke, Channel }` from that package — observed the module loading and its `invoke` wrapper resolving `'ok'`, an arrow calling `new Channel(…)` throwing `[vitest] No "Channel" export is defined on the "@tauri-apps/api/core" mock. Did you forget to return it from "vi.mock"?`, and a dynamic import of a second module that reads `Channel` in a module-level object literal rejecting with that same error]

A module that imports several names from a partially mocked package loads as long as every read of a name the factory left out is deferred into a function body; a shorthand property, a default argument or any other module-level read of such a name fails the importing module's load with that error.

## Vitest 5.0.2's `toThrow` matches a string argument as a substring of the thrown message and tests a RegExp argument against the whole message

**Verified at:** vitest 5.0.2, chai 6.2.2, read 2026-10-20
**Citation:** [code-reviewer_2: `app/node_modules/.pnpm/vitest@5.0.2_*/node_modules/vitest/dist/chunks/index.DGdajAO2.js:2288` — `def(["toThrow", "toThrowError"])` passes a string, undefined or RegExp argument to `this.throws(expected)`; `app/node_modules/.pnpm/chai@6.2.2/node_modules/chai/index.js:80-81` — a string matcher passes on `comparisonString.indexOf(errMatcher) !== -1`] [implement_7: the same chai file :77-79 — `comparisonString` is the thrown error's `message`, and a RegExp matcher passes on `errMatcher.test(comparisonString)`]

`rejects.toThrow('x')` passes for any message containing `x`, so two branches whose messages contain the same text are not told apart by it; an anchored RegExp such as `/^x$/` or `/ is x$/` pins the message or its tail.

## Vitest 5.0.2's `toThrow` with an `Error` instance compares the thrown error's name, message and enumerable own properties, and its `cause` only when the expected error's `cause` is defined

**Verified at:** vitest 5.0.2, read 2026-10-20
**Citation:** [implement_4: `app/node_modules/.pnpm/vitest@5.0.2_*/node_modules/vitest/dist/chunks/index.DGdajAO2.js:2316` and `:2323` — an `Error` instance or another object is compared with `equals(thrown, expected, [...customTesters, iterableEquality])`] [code-reviewer_7: the same chunk :1330-1341, `isErrorEqual` — `a.name === b.name && a.message === b.message`, then `if (typeof b.cause !== "undefined") result &&= eq(a.cause, b.cause, …)`, then `eq({ ...a }, { ...b }, …)` over the enumerable properties]

`toThrow(new Error('x'))` pins the exact message without caring what `cause` the thrown error carries, and pins `cause` too once the expected error is given one.

## Under Vitest 5.0.2 in the node environment, `import.meta.dirname` in a test file is that file's directory, and a `spawnSync(process.execPath, [<file>.ts], { env })` child inherits the given `HOME`

**Verified at:** Vitest 5.0.2, run 2026-10-20
**Citation:** [spec-writer_5: ran `npx vitest run dev-data-server/__tests__/scratch.test.ts` from `app/` — observed one passing test that spawned `dev-data-server/scratchEntry.ts` found through `join(import.meta.dirname, '..', 'scratchEntry.ts')` with `HOME=/tmp/fakehome` and asserted exit status 1, stdout `home=/tmp/fakehome` and the stderr text, with `npx tsc --noEmit` and `npx eslint` on both files reporting nothing]

A test can therefore run a Node entry script as a child process against a temporary home directory and read its exit status and output.
