# Sub-feature 2: Hook-test harness and the three scoped-save hooks

This sub-feature adds a shared harness for data-access-layer hook tests and the tests `.claude/rules/src-data-access-layer.md` requires of `useSession`, `useEncounter` and `useBaseEntity`. Each test pins which entity id, data and invalidated keys a deferred save uses after the screen re-renders for another entity, and which merge the hook passes. No hook source changes.

## Files affected

`Modified:`

- `app/src/data-access-layer/queryClient.ts` — the client construction becomes `createQueryClient()`; `queryClient` is built from it

`Deleted:` none

`New:`

- `app/src/data-access-layer/__tests__/support/renderHookWithQueryClient.ts`
- `app/src/data-access-layer/sessions/__tests__/useSession.test.ts`
- `app/src/data-access-layer/encounters/__tests__/useEncounter.test.ts`
- `app/src/data-access-layer/base-entities/__tests__/useBaseEntity.test.ts`

`Moved:` none

`Draft:`

- `.claude/knowledge/testing-library.md` — an unreviewed draft, already in the working tree. It is a new file holding one entry on how `waitFor` behaves under Vitest's fake timers, written while this spec was verified. Review it and commit it with this sub-feature.
- `.claude/knowledge/vitest.md` — an unreviewed draft, already in the working tree. One entry was added on settling a query and a debounced mutation with `advanceTimersByTimeAsync` inside `act`, written while this spec was verified. Review it and commit it with this sub-feature.

Barrels need no change. `app/src/data-access-layer/index.ts` keeps `export { queryClient } from './queryClient';`, uses explicit named exports as `app/src/CLAUDE.md` — Barrel Files requires, and does not export `createQueryClient`, which only `queryClient.ts` and the harness use. `TanstackQueryClientProvider.tsx` imports `queryClient` and needs no change.

## Layered breakdown

### Data Access Layer

#### `queryClient.ts`

- Add `export const createQueryClient = (): QueryClient => new QueryClient({ … })`. Its body is the current constructor call with its `defaultOptions` and both inline comments unchanged.
- Build the singleton from it, declared below the factory: `export const queryClient = createQueryClient();`.
- No behaviour changes for the app (root Key Architectural Decisions — Hook tests render under a fresh client built with production's defaults).

#### `__tests__/support/renderHookWithQueryClient.ts` (New)

Placement: this directory mirrors `app/db/__tests__/support/`, the repository's existing test-support directory. Vitest collects only `*.{test,spec}` files, so the file never runs as a test [spec-writer_35: .claude/knowledge/vitest.md:52]. It is a `.ts` file with no JSX (root Key Architectural Decisions — The harness is a `.ts` module that builds its wrapper with `createElement`). Only hook tests under `app/src/data-access-layer/` import it, through relative paths (`../../__tests__/support/renderHookWithQueryClient` from a module's `__tests__/`, `./support/renderHookWithQueryClient` from the layer root's `__tests__/`). It gets no test file: its behaviour is exercised by every hook test.

Imports: `createElement` and `type ReactNode` from `'react'`, `act` and `renderHook` from `'@testing-library/react'`, `QueryClientProvider` from `'@tanstack/react-query'`, `vi` from `'vitest'`, and `createQueryClient` from `'../../queryClient'`.

Exports, and nothing else:

- `renderHookWithQueryClient = <Result, Props>(render: (props: Props) => Result, options?: { initialProps: Props })`:
  - Builds `const queryClient = createQueryClient();` and `const invalidateQueries = vi.spyOn(queryClient, 'invalidateQueries');`.
  - Defines `const wrapper = ({ children }: { children: ReactNode }) => createElement(QueryClientProvider, { client: queryClient }, children);`.
  - Returns `{ ...renderHook(render, { wrapper, ...options }), queryClient, invalidateQueries }`.
  - The spy keeps the real method, so invalidations still refetch.
- `settle = async (ms: number): Promise<void>`, which runs `await act(() => vi.advanceTimersByTimeAsync(ms));` (root Key Architectural Decisions — Hook tests settle with `advanceTimersByTimeAsync` inside `act`, never `waitFor`).

One single-line comment above `settle`: it advances Vitest's fake timers inside `act` because Testing Library's `waitFor` does not re-check a hook test under fake timers.

#### Hook tests — shared shape

Each test file below:

- Mocks its service module with typed `vi.hoisted` spies and a `vi.mock` factory listing exactly the functions named for it (root Key Architectural Decisions — Each hook test mocks only the service functions its tested path calls). For example: `import type * as service from '@services/sessionService';` then `const getSessionById = vi.hoisted(() => vi.fn<typeof service.getSessionById>());`.
- Imports the hook and its key factory statically from the module (`'../useSession'`, `'../sessionKeys'`). The tests sit inside the module, and the rule that keeps query keys internal to the module is about its barrel.
- Imports `AUTOSAVE_DELAY_MS` from `'../../createAutosaveQueue'`, and `renderHookWithQueryClient` and `settle` from the harness.
- In `beforeEach`: `vi.useFakeTimers()`; the read spy resolves a complete row literal of the hook's entity type for any id (`mockImplementation((…) => Promise.resolve(…))`); the update spy `mockResolvedValue(undefined)`. In `afterEach`: `vi.useRealTimers()`.
- Renders with `initialProps` for entity 1 and adventure 1, then `await settle(0)` so the hook's query resolves; the hook's update function returns early until its query has data.
- Calls the hook's update function inside `act(() => { … })`.
- Asserts invalidations with `toHaveBeenCalledTimes` plus one `toHaveBeenCalledWith` per key (root Key Architectural Decisions — Invalidation assertions are order-insensitive).

Each file writes its own scenario steps and its own `beforeEach`/`afterEach` timer calls. The steps call a different hook function with different props in every file, so a shared helper would have to take those calls as callbacks: it would save three lines per test and hide the sequence the rule prescribes from the test's reader. The two timer calls match the form of the existing `__tests__/createAutosaveQueue.test.ts` and `__tests__/useAutosaveQueue.test.ts`. The `vi.mock` block has to stay in each file, because Vitest rejects `vi.mock` and `vi.hoisted` anywhere but a module's top level [spec-writer_36: .claude/knowledge/vitest.md:24].

Scenarios the tests use:

- **Re-render scenario**: after `settle(0)`, one edit `{ name: 'n' }`; `rerender` with entity 2 and adventure 2 (and `'pcs'` instead of `'npcs'` for `useBaseEntity`); then `await settle(AUTOSAVE_DELAY_MS)`.
- **Two-edit scenario**: after `settle(0)`, the edit `{ description: 'kept' }`, then the edit `{ name: 'n', description: undefined }`, then `await settle(AUTOSAVE_DELAY_MS)`, with no re-render.

Ids used: `'session-1'`/`'session-2'`, `'encounter-1'`/`'encounter-2'`, `'entity-1'`/`'entity-2'`, `'adventure-1'`/`'adventure-2'`.

#### `sessions/__tests__/useSession.test.ts` (New)

Mocks `getSessionById` and `updateSession` from `'@services/sessionService'`; renders `useSession(sessionId, adventureId)`.

1. `'writes the scheduled session and its data after a re-render for another session'` — re-render scenario.
   - Assert `updateSession` `toHaveBeenCalledTimes(1)` and `toHaveBeenCalledWith('session-1', { name: 'n' })`, two arguments matching `service.updateSession(id, data)`.
   - Defect caught: a `mutationFn` that reads the session id from the hook's closure saves to `'session-2'`.
2. `'invalidates the scheduled session and its adventure's list after a re-render for another adventure'` — re-render scenario.
   - Assert `invalidateQueries` `toHaveBeenCalledTimes(2)`, `toHaveBeenCalledWith({ queryKey: sessionKeys.detail('session-1') })` and `toHaveBeenCalledWith({ queryKey: sessionKeys.list('adventure-1') })`.
   - Defect caught: an `onSuccess` that reads `adventureId` from the hook's parameter invalidates `sessionKeys.list('adventure-2')`.
3. `'keeps an earlier edit's value when a later edit to the same session leaves it undefined'` — two-edit scenario.
   - Assert `updateSession` `toHaveBeenCalledTimes(1)` and `toHaveBeenCalledWith('session-1', { description: 'kept', name: 'n' })`.
   - Defect caught: a spread merge in place of `mergeScopedEdit` writes `description: undefined`, which fails the match against `'kept'`.

#### `encounters/__tests__/useEncounter.test.ts` (New)

Mocks `getEncounterById` and `updateEncounter` from `'@services/encounterService'`; renders `useEncounter(encounterId, adventureId)`. The same three tests as `useSession`, with the substitutions below; each test catches the same defect as its `useSession` counterpart.

| `useSession` test | `useEncounter` test |
| --- | --- |
| `updateSession`, `'session-1'` | `updateEncounter`, `'encounter-1'` |
| `sessionKeys.detail('session-1')`, `sessionKeys.list('adventure-1')` | `encounterKeys.detail('encounter-1')`, `encounterKeys.list('adventure-1')` |
| titles naming "session" | the same titles naming "encounter" |

#### `base-entities/__tests__/useBaseEntity.test.ts` (New)

Mocks `getBaseEntityById` and `updateBaseEntity` from `'@services/baseEntityService'`; renders `useBaseEntity(entityType, baseEntityId, adventureId)` with `initialProps` `'npcs'`, `'entity-1'`, `'adventure-1'`. The re-render scenario re-renders with `'pcs'`, `'entity-2'`, `'adventure-2'`.

1. `'writes the scheduled entity, its type and its data after a re-render for another entity'` — re-render scenario.
   - Assert `updateBaseEntity` `toHaveBeenCalledTimes(1)` and `toHaveBeenCalledWith('npcs', 'entity-1', { name: 'n' })`, three arguments matching `service.updateBaseEntity(entityType, id, data)`.
   - Defect caught: a `mutationFn` that reads the id or the entity type from the hook's closure saves to `'entity-2'` or as `'pcs'`.
2. `'invalidates the scheduled entity and its type's list in its adventure after a re-render'` — re-render scenario.
   - Assert `invalidateQueries` `toHaveBeenCalledTimes(2)`, `toHaveBeenCalledWith({ queryKey: baseEntityKeys.detail('npcs', 'entity-1') })` and `toHaveBeenCalledWith({ queryKey: baseEntityKeys.list('npcs', 'adventure-1') })`.
   - Defect caught: an `onSuccess` that reads `entityType` or `adventureId` from the hook's parameters.
3. `'keeps an earlier edit's value when a later edit to the same entity leaves it undefined'` — two-edit scenario.
   - Assert `toHaveBeenCalledWith('npcs', 'entity-1', { description: 'kept', name: 'n' })`, once.
   - Defect caught: a spread merge in place of `mergeScopedEdit`.

#### Proving the tests can fail

For each hook, apply each change below in turn, run its test file, confirm the named test fails, and revert:

- `mutationFn` reading the id from the hook's parameter (test 1);
- `onSuccess` reading `adventureId`, and for `useBaseEntity` also `entityType`, from the hook's parameters (test 2);
- the merge replaced by `(pending, patch) => ({ ...pending, data: { ...pending.data, ...patch.data } })` (test 3).

## Checks

From `app/`: `npx vitest run src/data-access-layer`, then the `every check` rows of root `CLAUDE.md` — Tool Use Discipline.
