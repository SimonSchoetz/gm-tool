# TanStack Query

## `useMutation`'s `onMutate` receives `(variables, context)` and can return a sync or async result

**Verified at:** @tanstack/react-query 5.101.2 (`@tanstack/query-core` 5.101.2)
**Citation:** [spec-writer_1: app/node_modules/@tanstack/query-core/build/legacy/_tsup-dts-rollup.d.ts:934-940 — `MutationOptions<TData, TError, TVariables, TOnMutateResult>.onMutate?: (variables: TVariables, context: MutationFunctionContext) => Promise<TOnMutateResult> | TOnMutateResult`]

`onMutate` fires synchronously before `mutationFn` runs (optimistic-update hook). A callback declared with only the leading `variables` parameter (omitting `context`) type-checks fine against this signature — TypeScript permits assigning a shorter-parameter-list function to a longer-parameter-list callback type. Safe to use `onMutate: (variables: TVariables) => { /* sync side effect */ }` without declaring the second parameter.

## `QueryClient` exposes `prefetchQuery` and `ensureQueryData`; `queryOptions` builds shareable option objects

**Verified at:** @tanstack/react-query 5.101.2
**Citation:** [plan-feature_15: app/node_modules/@tanstack/query-core/build/legacy/_tsup-dts-rollup.d.ts:1300 — `ensureQueryData<...>(options: EnsureQueryDataOptions<...>): Promise<TData>`; :1311 — `prefetchQuery<...>(options: FetchQueryOptions<...>): Promise<void>`; app/node_modules/@tanstack/react-query/build/legacy/_tsup-dts-rollup.d.ts:643 — `declare function queryOptions<...>`]

`ensureQueryData` resolves to the cached data, fetching only on a cache miss, and is the correct primitive for a route loader that must guarantee data before render. `prefetchQuery` returns `Promise<void>` and swallows errors, making it the correct primitive for speculative warm-ups (hover intent) where a failure must not surface. The `queryOptions` helper produces a single typed options object consumable by both `useQuery` and the `QueryClient` methods, which is how one query definition is shared between a React hook and a non-React caller such as a router loader.

## `useMutation`'s returned `mutate`/`mutateAsync` always dispatches through one `MutationObserver` instance shared across every re-render of the same hook call site — never a per-render-frozen `mutationFn` closure

**Verified at:** @tanstack/react-query 5.101.2

**Citation:** [implement_1: app/node_modules/@tanstack/react-query/build/modern/useMutation.js:12-41 — `const [observer] = React.useState(() => new MutationObserver(client, options));` (line 14-19, lazy initializer runs once, `observer` is stable across re-renders of the same call site); `React.useEffect(() => { observer.setOptions(options); }, [observer, options]);` (line 20-22, re-runs and overwrites the shared observer's options — including `mutationFn` — on every render where the `options` object identity changes, which it does whenever any closed-over value like an entity id changes); `const mutate = React.useCallback((variables, mutateOptions) => { observer.mutate(variables, mutateOptions).catch(noop); }, [observer]);` (line 31-36, delegates to the one shared `observer.mutate`, not to whichever render's `options` was in scope when `mutate` was obtained)]

Holding a reference to `updateMutation` (or its `.mutate`) from an earlier render does not pin that call to the `mutationFn` that was in scope when the reference was obtained — by the time `.mutate()` actually runs, the shared observer's `mutationFn` reflects whichever render most recently committed, since `setOptions` runs synchronously in a `useEffect` on every options-object change. This is a real footgun for a component that is reused (not remounted) across a changing entity id — e.g. a route param change under the same route pattern that TanStack Router resolves without remounting the matched component: a `mutationFn: (data) => service.update(entityId, data)` scheduled via `setTimeout` while `entityId` was `'A'` will, if it fires after a re-render where `entityId` became `'B'`, actually call `service.update('B', data)` — the debounce/pending-data plumbing around it must be re-verified independently.

The correct fix keeps the mutation inside `useMutation` rather than bypassing it: give `mutationFn` a `{ id, data }` parameter and pass the id through `mutate({ id, data })` as a call-time variable, with `id` captured by the deferred closure (the `setTimeout` callback) at schedule time — not read from `mutationFn`'s own closure at whatever time `setOptions` last ran. `variables` passed to `mutate()` are used immediately by that specific call and are not subject to the shared-observer repointing described above. This preserves `useMutation`'s `throwOnError` error-bubbling and the rest of its dispatch machinery, unlike fully bypassing `mutate` and calling the service function directly (a working but architecturally inferior alternative — see `app/src/data-access-layer/session-steps/useSessionSteps.ts:42-45,96-101` for the canonical example of this shape, applied to a debounced per-step update keyed by a collection-scoped id).

---
**Reverified at:** @tanstack/react-query 5.101.4 / @tanstack/query-core 5.101.4 (2026-08-23)
**Citation:** [implement_2: app/node_modules/.pnpm/@tanstack+query-core@5.101.4/node_modules/@tanstack/query-core/build/modern/_tsup-dts-rollup.d.ts:684 — `onSuccess?: (data: TData, variables: TVariables, onMutateResult: TOnMutateResult | undefined, context: MutationFunctionContext) => void;` confirms `variables` (the object passed to `mutate()`) is the second parameter, distinct from and unaffected by whatever `mutationFn` closure was most recently set via `setOptions`]

Unchanged from the 5.101.2 finding above; version bump only (pnpm now resolves `@tanstack/query-core` into its own `.pnpm` store entry rather than the flat `node_modules/@tanstack/query-core` path cited in the original entry — future lookups should resolve the current path via `.pnpm/@tanstack+query-core@<version>` rather than assuming the flat layout).
