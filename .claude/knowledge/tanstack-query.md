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

## A `mutationFn` is called with `(variables, context)`

**Verified at:** @tanstack/query-core 5.103.1, read 2026-09-21
**Citation:** [spec-writer_37: app/node_modules/.pnpm/@tanstack+query-core@5.103.1/node_modules/@tanstack/query-core/build/modern/hydration-Cq7QYAzB.d.ts:2478 — `type MutationFunction<TData = unknown, TVariables = unknown> = (variables: TVariables, context: MutationFunctionContext) => Promise<TData>`]

A function passed directly as `mutationFn` receives the mutation's variables and TanStack's context object as arguments, so a test of a hook that forwards a caller's function as `mutationFn` cannot assert a call with no arguments.

## `mutateAsync` resolves only after the hook-level `onSuccess` has settled, so a hook-level `onSuccess` that returns a promise holds it back

**Verified at:** @tanstack/react-query 5.104.0 (`@tanstack/query-core` 5.104.0)
**Citation:** [architect_1: app/node_modules/.pnpm/@tanstack+query-core@5.104.0/node_modules/@tanstack/query-core/src/mutation.ts:349-375 — `execute` awaits `this.#mutationCache.config.onSuccess`, then `this.options.onSuccess` (line 357), then both `onSettled` callbacks, before `this.#dispatch({ type: 'success', data })` and `return data`] [architect_2: app/node_modules/.pnpm/@tanstack+query-core@5.104.0/node_modules/@tanstack/query-core/src/mutationObserver.ts:214-219 — `mutate()` builds the mutation from `this.options` and returns `execute(variables)`; :76 binds `this.mutate`; :235 puts `mutate: this.mutate` on the observer result] [spec-writer_1: app/node_modules/@tanstack/react-query/src/useMutation.ts:244 — `return { ...result, mutate, mutateAsync: result.mutate }`]

`useMutation`'s `mutateAsync` is the observer's `mutate`, which builds the mutation from the observer's options and returns its `execute` promise. `execute` returns the data only after the hook-level `onSuccess` (the one passed to `useMutation`) has settled, so a hook-level `onSuccess` that returns a promise delays `mutateAsync` until that promise settles.

## `invalidateQueries` returns its refetch's promise, which settles once every matching query it refetches has settled and does not reject on a refetch failure by default

**Verified at:** @tanstack/query-core 5.104.0
**Citation:** [architect_1: app/node_modules/.pnpm/@tanstack+query-core@5.104.0/node_modules/@tanstack/query-core/src/queryClient.ts:469-530 — `invalidateQueries` returns `Promise.resolve()` when `filters?.refetchType === 'none'` (line 478), else `this.refetchQueries({ ...filters, type: filters?.refetchType ?? filters?.type ?? 'active' }, options)`; `refetchQueries`' doc comment says disabled or static ("only have observers with a static `staleTime`") queries are never refetched, it filters out `query.isDisabled()` and `query.isStatic()`, attaches `.catch(noop)` unless `fetchOptions.throwOnError` (built from its second, `options` argument), and returns `Promise.all(promises).then(noop)`]

Unless `refetchType` is `'none'`, `invalidateQueries` refetches the matching queries of type `'active'` by default, skipping disabled and static ones, and returns that refetch's promise. A refetch failure does not reject it unless `throwOnError: true` is passed in its second (`options`) argument.

## A `setQueryData` write is readable through `getQueryData` at once, but `useQuery` re-renders with it only after a `setTimeout(0)`

**Verified at:** @tanstack/react-query 5.104.0 (`@tanstack/query-core` 5.104.0)
**Citation:** [architect_10: @tanstack/query-core 5.104.0 src/notifyManager.ts:19, 32-39, 78-86, src/timeoutManager.ts:241-243 — `batchCalls` wraps a listener so it runs through the notify manager's scheduler, which defaults to a `setTimeout(0)`] [architect_11: @tanstack/react-query 5.104.0 src/useBaseQuery.ts:95-99 — `useSyncExternalStore` subscribes through `notifyManager.batchCalls`] [architect_13: @tanstack/query-core 5.104.0 src/query.ts:892, src/queryClient.ts `getQueryData` — reads the query's current state synchronously]

`useQuery` subscribes to the cache through `notifyManager.batchCalls`, so a component learns of a `setQueryData` write only after a `setTimeout(0)`, while `getQueryData` returns the written value immediately. For at least one task after a write, data a component received through `useQuery` at its last render is therefore stale, and code that must build on the latest value reads it with `getQueryData` at call time.
