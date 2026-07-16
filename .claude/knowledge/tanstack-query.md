# TanStack Query

## `useMutation`'s `onMutate` receives `(variables, context)` and can return a sync or async result

**Verified at:** @tanstack/react-query 5.101.2 (`@tanstack/query-core` 5.101.2)
**Citation:** [S_1: app/node_modules/@tanstack/query-core/build/legacy/_tsup-dts-rollup.d.ts:934-940 — `MutationOptions<TData, TError, TVariables, TOnMutateResult>.onMutate?: (variables: TVariables, context: MutationFunctionContext) => Promise<TOnMutateResult> | TOnMutateResult`]

`onMutate` fires synchronously before `mutationFn` runs (optimistic-update hook). A callback declared with only the leading `variables` parameter (omitting `context`) type-checks fine against this signature — TypeScript permits assigning a shorter-parameter-list function to a longer-parameter-list callback type. Safe to use `onMutate: (variables: TVariables) => { /* sync side effect */ }` without declaring the second parameter.
