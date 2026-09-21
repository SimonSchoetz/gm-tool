# Sub-feature 4: Test for `useDuplicateMutation`

`.claude/rules/src-unit-tests.md` — Testing Policy requires a test for every hook shared by several data-access-layer modules at the layer root and names `useDuplicateMutation.ts`, which has none. This sub-feature adds it. Implement after Sub-feature 2, whose harness it imports.

## Files affected

`Modified:` none

`Deleted:` none

`New:`

- `app/src/data-access-layer/__tests__/useDuplicateMutation.test.ts`

`Moved:` none

`Draft:`

- `.claude/knowledge/tanstack-query.md` — an unreviewed draft, already in the working tree. One entry was added ("A `mutationFn` is called with `(variables, context)`"), written while this spec was verified. Review it and commit it with this sub-feature.

## Layered breakdown

### Data Access Layer

#### `__tests__/useDuplicateMutation.test.ts` (New)

- Placement: the layer root's `__tests__/`, mirroring the file name, as the Testing Policy requires.
- Imports `renderHookWithQueryClient` from `'./support/renderHookWithQueryClient'` and `act` from `'@testing-library/react'`.
- No service mock and no fake timers. The hook takes its duplicate function as a parameter and schedules no timer.
- Fixture: `const LIST_KEY = ['sessions', 'adventure-1'] as const;` and `const duplicateFn = vi.fn(() => Promise.resolve('new-id'));`.

Both tests render `renderHookWithQueryClient(() => useDuplicateMutation(duplicateFn, LIST_KEY))` and run `await act(() => result.current())`. This shape type-checks, lints and passes [spec-writer_31].

1. `'invalidates only the list key it was given'`:
   - Assert `invalidateQueries` `toHaveBeenCalledTimes(1)` and `toHaveBeenCalledWith({ queryKey: LIST_KEY })`.
   - Defects caught: invalidating a detail key or any key besides the list key the caller passed, which `.claude/rules/src-data-access-layer.md` — Non-negotiable rules forbids for a duplicate; not invalidating at all.
2. `'resolves to the id the duplicate produced'`:
   - Keep the result as `const newId = await act(() => result.current());`.
   - Assert `newId` is `'new-id'` and `duplicateFn` was called once.
   - Only the call count is asserted for `duplicateFn`. TanStack Query calls a `mutationFn` with its own `(variables, context)` arguments [spec-writer_37: app/node_modules/.pnpm/@tanstack+query-core@5.103.1/node_modules/@tanstack/query-core/build/modern/hydration-Cq7QYAzB.d.ts:2478 — `type MutationFunction<TData, TVariables> = (variables: TVariables, context: MutationFunctionContext) => Promise<TData>`].
   - Defects caught: a wrapper that drops or replaces the duplicate's return value; one that runs the duplicate twice.

No failure-path test (root Key Architectural Decisions — `useDuplicateMutation`'s failure path gets no test).

## Checks

From `app/`: `npx vitest run src/data-access-layer`, then the full suite of root `CLAUDE.md` — Tool Use Discipline before committing.
