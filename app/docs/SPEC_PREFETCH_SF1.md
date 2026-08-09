# SF1 — Router-owned query client

Hoist the `QueryClient` so it is constructed above the router and reachable from route loaders as typed context. No loader is added in this sub-feature; this establishes the wiring SF4 and SF5 consume.

## Files affected

- `New:` `app/src/data-access-layer/queryClient.ts`
- `Modified:` `app/src/data-access-layer/TanstackQueryClientProvider.tsx` — stops constructing the client, imports it
- `Modified:` `app/src/data-access-layer/index.ts` — barrel gains `queryClient` and `TanstackQueryClientProvider`
- `Modified:` `app/src/main.tsx` — router context, preload options, provider placement
- `Modified:` `app/src/App.tsx` — drops the provider wrapper and its deep import
- `Modified:` `app/src/routes/__root.tsx` — typed root route context

## Data Access Layer

### `queryClient.ts` (new)

Exports a single `queryClient` constant holding the `QueryClient` instance. Move the existing configuration across verbatim — `retry: 1`, `refetchOnWindowFocus: false`, `staleTime: 5 * 60 * 1000` under `queries`, and `throwOnError: true` under `mutations`. Do not change any value; the five-minute `staleTime` and the mutation error contract are relied on elsewhere.

### `TanstackQueryClientProvider.tsx`

Delete the local `new QueryClient({...})` construction and the now-unused `QueryClient` import. Import `queryClient` from `./queryClient` and pass it to `QueryClientProvider`. The component's props and rendered output are otherwise unchanged.

### `index.ts`

Add two explicit named exports alongside the existing ones: `queryClient` from `./queryClient`, and `TanstackQueryClientProvider` from `./TanstackQueryClientProvider`. Explicit named exports only — this is a grouping barrel and `export *` is banned in it.

The provider export is required because `App.tsx` currently reaches it through the deep path `./data-access-layer/TanstackQueryClientProvider`, which violates the one-level import rule for grouping folders. SF1 removes that import from `App.tsx` entirely, and `main.tsx` takes it up through the barrel instead.

## Frontend

### `main.tsx`

Import `queryClient` and `TanstackQueryClientProvider` from `@/data-access-layer`.

Extend the `createRouter` call with three options beyond the existing `routeTree`:

- `context: { queryClient }` — what loaders read.
- `defaultPreload: 'intent'` — warms `<Link>` surfaces ahead of their loader. Additive only; the guarantee comes from loaders.
- `defaultPreloadStaleTime: 0` — makes TanStack Query the sole freshness authority. The router otherwise treats preloaded route data as fresh for 30 seconds and skips re-running the loader, which would put staleness decisions in two places with different windows. At `0` the loader always re-runs and delegates to `ensureQueryData`, which applies the query's own `staleTime`.

Wrap `<RouterProvider router={router} />` in `<TanstackQueryClientProvider>`, inside the existing `<React.StrictMode>`. The `declare module '@tanstack/react-router'` block registering `typeof router` stays exactly as it is, including its surrounding eslint-disable comments.

### `App.tsx`

Remove the `TanstackQueryClientProvider` import and the JSX wrapper. `App` becomes the outer `ErrorBoundary` wrapping `AppContent` directly. Keep both `ErrorBoundary` instances, `AppContent`, the `useConnectivityLifecycle` call, and its two explanatory comments unchanged — the comment stating that `App` wraps the provider is now false and must be deleted along with the wrapper it describes.

### `routes/__root.tsx`

Replace `createRootRoute` with `createRootRouteWithContext<{ queryClient: QueryClient }>()`, noting the double invocation: the generic call returns the route factory, which is then called with the options object. Import `QueryClient` as a type from `@tanstack/react-query`.

The options object is unchanged — `component: RootLayout` and the existing `beforeLoad` awaiting `ensureInitialized()`. That `beforeLoad` must remain on the root route: it gates database initialization, and every child loader added in SF4 and SF5 depends on running after it.

Keep the file's leading eslint-disable comment for `react-refresh/only-export-components`.

## Verification

`npx tsc --noEmit` and `npx eslint .` from `app/`. The app must still start and render with no functional change — this sub-feature moves ownership only. `npm run dev` is required to exercise it, since every screen depends on database access that `npm run web` cannot reach.
