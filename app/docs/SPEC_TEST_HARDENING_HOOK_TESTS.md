# Spec: Hook tests and db absence assertions

- Sub-feature 1: Absence assertions read the test's own database — the two db tests that assert a row is gone through a module's reader read the table directly
- Sub-feature 2: Hook-test harness and the three scoped-save hooks — a shared `renderHookWithQueryClient` on production's `QueryClient` defaults; tests for `useSession`, `useEncounter` and `useBaseEntity`
- Sub-feature 3: Tests for the five other autosave hooks — `useAdventure`, `useSessionSteps`, `useBaseEntityContentSections`, `useOwnDevice`, `useUpdateImageFrame`
- Sub-feature 4: Test for `useDuplicateMutation` — the layer-root hook's list invalidation and return value

Sub-features 3 and 4 import the harness Sub-feature 2 creates and are implemented after it. Sub-feature 1 is independent.

## Files

- [Sub-feature 1](SPEC_TEST_HARDENING_HOOK_TESTS_SF1.md)
- [Sub-feature 2](SPEC_TEST_HARDENING_HOOK_TESTS_SF2.md)
- [Sub-feature 3](SPEC_TEST_HARDENING_HOOK_TESTS_SF3.md)
- [Sub-feature 4](SPEC_TEST_HARDENING_HOOK_TESTS_SF4.md)

Every repo-state citation below is as of commit `8b186f88`; check it against HEAD before relying on it. No sub-feature edits a `CLAUDE.md`, a file under `.claude/rules/`, or `.claude/gimbal.md`.

## Key Architectural Decisions

### Hook tests render under a fresh client built with production's defaults

`app/src/data-access-layer/queryClient.ts` builds the app's only `QueryClient` [spec-writer_30: grep `new QueryClient` app/src — found only queryClient.ts:3, as of 8b186f88]. It becomes a `createQueryClient()` factory, and the app's `queryClient` singleton is `createQueryClient()`. The harness calls the factory once per render, so every test has its own cache and runs on the defaults the app runs on. A bare `new QueryClient()` would differ in `staleTime` (whether re-rendering for another id refetches, which changes how often a mocked service is called) and in `mutations.throwOnError` (whether a rejected mock surfaces or passes silently). The hooks' tests would then check a configuration the app never uses. `createQueryClient` gets no test file. It is not a helper shared by several data-access-layer modules (`.claude/rules/src-unit-tests.md` — Testing Policy), since its only consumers are `queryClient.ts` and the test harness, and a test of it could only restate its option literals.

### Hook tests settle with `advanceTimersByTimeAsync` inside `act`, never `waitFor`

`.claude/rules/src-data-access-layer.md` (Non-negotiable rules, the bullet beginning "A hook with a deferred save") asks a test to let the hook's query resolve and to advance the timers. Testing Library's `waitFor` treats timers as real unless a `jest` global exists, and Vitest defines none, so under `vi.useFakeTimers()` it re-checks a `renderHook` test only when timers are advanced [review-decision_17: app/node_modules/.pnpm/@testing-library+dom@10.4.1/node_modules/@testing-library/dom/dist/helpers.js:14-28] [review-decision_18: …/dom/dist/wait-for.js:40, 91-97] [spec-writer_29: app/node_modules/vitest/dist/chunks/constants.-juJ8b_4.js:16 — `globalApis` lists no `jest`]. `await act(() => vi.advanceTimersByTimeAsync(ms))` does settle the hook's query, the queue's timer and the mutation it dispatches, `onSuccess` included [spec-writer_27: app/node_modules/vitest/dist/index.d.ts:466-468] [spec-writer_28: ran `npx vitest run` from `app/` on a scratch test rendering `useSession` this way — observed the query's data present after `advanceTimersByTimeAsync(0)`, and after two edits, a re-render for another session and adventure and `advanceTimersByTimeAsync(AUTOSAVE_DELAY_MS)`, the mocked update called once with the scheduled id and merged data and `invalidateQueries` called exactly with the scheduled keys; scratch deleted]. Both facts are recorded in `.claude/knowledge/testing-library.md` and `.claude/knowledge/vitest.md`. The harness wraps the step as `settle(ms)`.

### The harness is a `.ts` module that builds its wrapper with `createElement`

`renderHook` needs a wrapper component that closes over the per-call client. The harness builds it with `createElement(QueryClientProvider, { client: queryClient }, children)` in a `.ts` file, not JSX in a `.tsx` file. The file is test support, not a component, and `.claude/rules/src-components.md` loads for `app/src/**/*.tsx`, where its component rules (`FCProps` props, no inline sub-components) would apply to a closure that has to be inline. This shape type-checks, lints and runs [spec-writer_31: ran `npx tsc --noEmit`, `npx eslint` and `npx vitest run` from `app/` on a scratch test declaring the harness below and calling it with `useDuplicateMutation` and with `initialProps` plus `rerender` — observed zero findings and two passing tests; scratch deleted].

### Each hook test mocks only the service functions its tested path calls

A hook test mocks its `@services/<file>` module with `vi.hoisted` spies typed against the real export and a `vi.mock` factory returning only those spies. This is the wiring `.claude/rules/services-unit-tests.md` states for service tests; it holds here because the data-access-layer rule requires the same kind of mock. The factory lists the read function behind the hook's query and the function its save calls; `useUpdateImageFrame` has no query, so its factory lists only `updateImageFrame`. The hooks reference their other service functions (delete, duplicate, create, reorder) only inside callbacks the tests never invoke, and a scratch test mocking only `getSessionById` and `updateSession` rendered `useSession` and completed a save [spec-writer_28]. Static imports of the hook and its service mock are correct: the hooks read their `QueryClient` from the provider, and the harness builds a fresh one per render, so no test reaches module-level singleton state and the reset-and-dynamic-import rule of `app/CLAUDE.md` — Testing does not apply.

### Invalidation assertions are order-insensitive

A hook that invalidates two keys is checked with `toHaveBeenCalledTimes(2)` plus one `toHaveBeenCalledWith` per key, never with an ordered comparison of `invalidateQueries.mock.calls`. The order the hook invalidates in is not a requirement, and pinning it would fail a correct reordering.

### A re-render step exists only where a hook parameter could redirect the pending save

The rule's recipe re-renders "with a different entity id or `adventureId`". `useSession`, `useEncounter`, `useBaseEntity`, `useAdventure` and `useUpdateImageFrame` take the saved entity's id (and `adventureId` or `entityType`) as hook parameters, so their tests re-render with other values before the save fires. `useSessionSteps` and `useBaseEntityContentSections` take a parent id (`sessionId`, `baseEntityId`). The saved step or section id is passed per call, so their tests re-render with another parent id to show a parent change does not redirect the pending save. `useOwnDevice` takes no parameter, so its tests have no re-render step.

### An absence assertion that also names a kept row may stay on the reader

`.claude/rules/db-unit-tests.md` forbids reading absence through a module's reader because "a reader that fails and returns nothing satisfies it too". `expect(await getAll()).toEqual([])` has that flaw and moves to a raw select. A list assertion such as `expect((await getAll()).map(…)).toEqual([keptId])` also shows the removed row is gone, but a reader returning nothing fails it, so the stated failure cannot occur. Those assertions stay as they are. The rule's wording on this case is recorded under CLAUDE.md impact.

### `useDuplicateMutation`'s failure path gets no test

A failed duplicate invalidates nothing only because the hook uses `onSuccess`, not `onSettled`. Refreshing the list after a failed duplicate would be harmless, so no defect fails such a test, and it would not earn its place (shared rules, Best Practices & Code Quality, the rule beginning "A test earns its place by the regression it catches"). Under production's `mutations.throwOnError: true`, the rejection would also be thrown during the hook's next render.

## CLAUDE.md impact

- `.claude/rules/src-data-access-layer.md` — Non-negotiable rules, the bullet beginning "A hook with a deferred save", says to render the hook "with `renderHook` under a `QueryClientProvider`", "let the hook's own query resolve" and "advance the timers". It names no shared harness. After this branch, `app/src/data-access-layer/__tests__/support/renderHookWithQueryClient.ts` exports `renderHookWithQueryClient`, which renders on a fresh client from `createQueryClient()` (`app/src/data-access-layer/queryClient.ts`) and spies on `invalidateQueries`, and `settle(ms)`, which runs `act(() => vi.advanceTimersByTimeAsync(ms))`. Consequence: an author of a new hook test has no pointer to the harness. That author is likely to build a bare `new QueryClient()` wrapper, whose defaults differ from production, or to wait with `waitFor`, whose behaviour under the fake timers the bullet requires is recorded in `.claude/knowledge/testing-library.md`. [spec-writer_32: .claude/rules/src-data-access-layer.md, Non-negotiable rules — as of 8b186f88]
- `.claude/rules/db-unit-tests.md` says "An assertion that rows are absent … reads them from the test's own database … never through a module's reader", and gives as its reason that "a reader that fails and returns nothing satisfies it too". Seven remove tests assert a list that holds the kept row(s) through a module's reader, which also shows the removed row is absent:
  - `app/db/adventure/__tests__/remove.test.ts:80`
  - `app/db/session/__tests__/remove.test.ts:30`
  - `app/db/encounter/__tests__/remove.test.ts:27`
  - `app/db/session-step/__tests__/remove.test.ts:27`
  - `app/db/base-entity/__tests__/remove.test.ts:39`
  - `app/db/base-entity-content-section/__tests__/remove.test.ts:39`
  - `app/db/paired-device/__tests__/remove.test.ts:27`

  A reader returning nothing fails those assertions, so the stated reason does not apply, but the wording covers them. Consequence: a reader applying the wording strictly flags all seven, and one applying the reason flags none. [spec-writer_33: sed of each listed line — each asserts `.toEqual([keptId])` or `.toEqual([KEPT_DEVICE])`, as of 8b186f88]
