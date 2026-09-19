# TanStack Query

## `useMutation`'s `onMutate` receives `(variables, context)` and can return a sync or async result

**Verified at:** @tanstack/react-query 5.101.2 (`@tanstack/query-core` 5.101.2)
**Citation:** [spec-writer_1: app/node_modules/@tanstack/query-core/build/legacy/_tsup-dts-rollup.d.ts:934-940 — `MutationOptions<TData, TError, TVariables, TOnMutateResult>.onMutate?: (variables: TVariables, context: MutationFunctionContext) => Promise<TOnMutateResult> | TOnMutateResult`]

`onMutate` fires synchronously before `mutationFn` runs (optimistic-update hook). A callback declared with only the leading `variables` parameter (omitting `context`) type-checks fine against this signature — TypeScript permits assigning a shorter-parameter-list function to a longer-parameter-list callback type. Safe to use `onMutate: (variables: TVariables) => { /* sync side effect */ }` without declaring the second parameter.

## `QueryClient.query({ ...options, staleTime: 'static' })` replaces the deprecated `ensureQueryData`; `fetchQuery` and `prefetchQuery` are deprecated in favor of `query(options)`

**Verified at:** @tanstack/react-query 5.103.1 / @tanstack/query-core 5.103.1 — 2026-09-19
**Citation:** [dependency-update_1: app/node_modules/.pnpm/@tanstack+query-core@5.103.1/node_modules/@tanstack/query-core/build/modern/hydration-Cq7QYAzB.d.ts:1336 — read: `@deprecated Use queryClient.query({ ...options, staleTime: 'static' }) instead` on `ensureQueryData`; :1490-1491 — `query` "replaces the deprecated `fetchQuery`, and — combined with `{ staleTime: 'static' }` — the deprecated `ensureQueryData`"; :1504,1508 — `@deprecated Use queryClient.query(options) instead` on `fetchQuery` and `prefetchQuery` (the latter adds "You can swallow errors with `.catch(noop)`"); app/node_modules/.pnpm/@tanstack+query-core@5.103.1/node_modules/@tanstack/query-core/build/modern/queryClient.js:129-136 — read: `ensureQueryData` returns `query.state.data` when defined and calls `fetchQuery` otherwise; query.js:216 — `if (staleTime === "static") return false;`; dependency-update_2: ran npx eslint . — observed 32 `@typescript-eslint/no-deprecated` errors on `ensureQueryData` call sites, then 0 after they became `queryClient.query({ ...options, staleTime: 'static' })`]

`ensureQueryData` returned the cached data and fetched only on an empty cache, and `Query.isStaleByTime` treats a `'static'` staleTime as never stale. A route loader that must guarantee data before render therefore calls `queryClient.query({ ...options, staleTime: 'static' })`. `prefetchQuery` is deprecated too, with `query(options)` plus `.catch(noop)` as its replacement.

## `queryOptions` builds one typed options object consumable by both `useQuery` and `QueryClient` methods

**Verified at:** @tanstack/react-query 5.103.1 — 2026-09-19
**Citation:** [dependency-update_3: app/node_modules/.pnpm/@tanstack+react-query@5.103.1_react@19.3.0/node_modules/@tanstack/react-query/build/modern/queryOptions.d.ts:104,136,191 — read: `declare function queryOptions<...>` overloads; dependency-update_4: ran npx tsc --noEmit — observed exit 0 with `context.queryClient.query({ ...adventureListQueryOptions(), staleTime: 'static' })` in app/src/routes/adventures.tsx]

One query definition is shared between a React hook and a non-React caller such as a router loader by spreading the `queryOptions` result into the `QueryClient` call.

## `useMutation`'s returned `mutate`/`mutateAsync` always dispatches through one `MutationObserver` instance shared across every re-render of the same hook call site — never a per-render-frozen `mutationFn` closure

**Verified at:** @tanstack/react-query 5.103.1 / @tanstack/query-core 5.103.1 — 2026-09-19
**Citation:** [debounce_32: app/node_modules/.pnpm/@tanstack+react-query@5.103.1_react@19.3.0/node_modules/@tanstack/react-query/build/modern/useMutation.js:180-188 — read: the observer is created once with `React.useState(() => new MutationObserver(...))`, `observer.setOptions(options)` runs in an effect, and `mutate` is a `useCallback` over `[observer]`] [head-of-instructions_1: at 5.101.4, useMutation.js:14-22,31-36 — read: `const [observer] = React.useState(() => new MutationObserver(client, options));` (lazy initializer, stable across re-renders of the same call site); `React.useEffect(() => { observer.setOptions(options); }, [observer, options]);` (re-runs on every render where the `options` object identity changes, overwriting the shared observer's options including `mutationFn`); `mutate` is a `useCallback` over `[observer]` that calls `observer.mutate(variables, mutateOptions)`; app/node_modules/.pnpm/@tanstack+query-core@5.101.4/node_modules/@tanstack/query-core/build/modern/_tsup-dts-rollup.d.ts:684 — read: `onSuccess?: (data: TData, variables: TVariables, onMutateResult: TOnMutateResult | undefined, context: MutationFunctionContext) => void;`, so `variables` (the object passed to `mutate()`) is the second parameter, distinct from whatever `mutationFn` closure was most recently set via `setOptions`]

Holding a reference to `updateMutation` (or its `.mutate`) from an earlier render does not pin that call to the `mutationFn` that was in scope when the reference was obtained — by the time `.mutate()` actually runs, the shared observer's `mutationFn` reflects whichever render most recently committed, since `setOptions` runs synchronously in a `useEffect` on every options-object change. This is a real footgun for a component that is reused (not remounted) across a changing entity id — e.g. a route param change under the same route pattern that TanStack Router resolves without remounting the matched component: a `mutationFn: (data) => service.update(entityId, data)` scheduled via `setTimeout` while `entityId` was `'A'` will, if it fires after a re-render where `entityId` became `'B'`, actually call `service.update('B', data)` — the debounce/pending-data plumbing around it must be re-verified independently.

The correct fix keeps the mutation inside `useMutation` rather than bypassing it: give `mutationFn` a `{ id, data }` parameter and pass the id through `mutate({ id, data })` as a call-time variable, with `id` captured by the deferred closure (the `setTimeout` callback) at schedule time — not read from `mutationFn`'s own closure at whatever time `setOptions` last ran. `variables` passed to `mutate()` are used immediately by that specific call and are not subject to the shared-observer repointing described above. This preserves `useMutation`'s `throwOnError` error-bubbling and the rest of its dispatch machinery, unlike fully bypassing `mutate` and calling the service function directly (a working but architecturally inferior alternative).

## A `mutate()` called after the component unmounts still runs `mutationFn` and the hook-level callbacks; per-call callbacks do not fire and errors are not rethrown

**Verified at:** @tanstack/react-query 5.103.1 / @tanstack/query-core 5.103.1, run 2026-09-19
**Citation:** [debounce_34: app/node_modules/.pnpm/@tanstack+query-core@5.103.1/node_modules/@tanstack/query-core/build/modern/mutationObserver.js:126-132 — `mutate` builds a `Mutation` from the observer's options and calls `execute` with no listener check; :147 — per-call callbacks are gated on `this.hasListeners()`] [debounce_36: same package, mutation.js:130-219 — `execute` calls `options.mutationFn`, then `onSuccess`/`onError` and `onSettled`] [debounce_38: ran a scratch probe calling a first-render `mutate` from an unmount cleanup with `mutations.throwOnError: true` — observed `mutationFn`, hook `onSuccess` and `onSettled` running, per-call callbacks absent, and no unhandled rejection on failure]

A hook can flush a pending write from its unmount cleanup through its own `mutate`: the write and the hook-level cache invalidation still happen, but anything passed as a per-call option to that `mutate` is skipped.

## `useMutation` returns a new object on every render, while its `mutate` keeps one identity per hook instance

**Verified at:** @tanstack/react-query 5.103.1, 2026-09-19
**Citation:** [spec-writer_54: app/node_modules/.pnpm/@tanstack+react-query@5.103.1_react@19.3.0/node_modules/@tanstack/react-query/build/modern/useMutation.js:185-193 — `mutate` is a `React.useCallback` over `[observer]`, and the hook returns the object literal `{ ...result, mutate, mutateAsync: result.mutate }`]

A hook dependency on the whole mutation object (`[updateMutation]`) changes on every render, so a `useMemo` or effect keyed on it re-runs each time; a dependency on `updateMutation.mutate` alone does not.
