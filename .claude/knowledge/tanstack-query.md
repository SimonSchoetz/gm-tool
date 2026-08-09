# TanStack Query

## `useMutation`'s `onMutate` receives `(variables, context)` and can return a sync or async result

**Verified at:** @tanstack/react-query 5.101.2 (`@tanstack/query-core` 5.101.2)
**Citation:** [spec-writer_1: app/node_modules/@tanstack/query-core/build/legacy/_tsup-dts-rollup.d.ts:934-940 — `MutationOptions<TData, TError, TVariables, TOnMutateResult>.onMutate?: (variables: TVariables, context: MutationFunctionContext) => Promise<TOnMutateResult> | TOnMutateResult`]

`onMutate` fires synchronously before `mutationFn` runs (optimistic-update hook). A callback declared with only the leading `variables` parameter (omitting `context`) type-checks fine against this signature — TypeScript permits assigning a shorter-parameter-list function to a longer-parameter-list callback type. Safe to use `onMutate: (variables: TVariables) => { /* sync side effect */ }` without declaring the second parameter.

## `QueryClient` exposes `prefetchQuery` and `ensureQueryData`; `queryOptions` builds shareable option objects

**Verified at:** @tanstack/react-query 5.101.2
**Citation:** [plan-feature_15: app/node_modules/@tanstack/query-core/build/legacy/_tsup-dts-rollup.d.ts:1300 — `ensureQueryData<...>(options: EnsureQueryDataOptions<...>): Promise<TData>`; :1311 — `prefetchQuery<...>(options: FetchQueryOptions<...>): Promise<void>`; app/node_modules/@tanstack/react-query/build/legacy/_tsup-dts-rollup.d.ts:643 — `declare function queryOptions<...>`]

`ensureQueryData` resolves to the cached data, fetching only on a cache miss, and is the correct primitive for a route loader that must guarantee data before render. `prefetchQuery` returns `Promise<void>` and swallows errors, making it the correct primitive for speculative warm-ups (hover intent) where a failure must not surface. The `queryOptions` helper produces a single typed options object consumable by both `useQuery` and the `QueryClient` methods, which is how one query definition is shared between a React hook and a non-React caller such as a router loader.
