# TanStack Router

## `navigate()` and `<Link>` accept a `state` option for non-URL navigation payloads

**Verified at:** `@tanstack/react-router` 1.170.17 (resolved in `app/node_modules/@tanstack/react-router/package.json`)
**Citation:** [architect_1: app/node_modules/@tanstack/router-core/dist/esm/link.d.ts:126]

Navigation options expose `state?: true | NonNullableUpdater<ParsedHistoryState, HistoryState>`. This carries a payload through a navigation via the History API rather than the URL, so the value does not appear in the address bar and does not survive a page reload.

## `HistoryState` is an empty interface designed for declaration merging

**Verified at:** `@tanstack/history` (transitive dependency of `@tanstack/react-router` 1.170.17)
**Citation:** [architect_2: app/node_modules/@tanstack/history/dist/esm/index.d.ts:41-48]

`export interface HistoryState {}` is declared empty. `ParsedHistoryState` extends it with router-internal keys (`key?`, `__TSR_key?`, `__TSR_index`). Application code adds typed fields to navigation state by augmenting the module:

```ts
declare module '@tanstack/history' {
  interface HistoryState {
    someFlag?: boolean;
  }
}
```

Because the interface is empty by default, an un-augmented codebase cannot pass arbitrary typed keys through `state` — the augmentation is required, not optional.

## `useRouterState` reads navigation state via its `select` option

**Verified at:** `@tanstack/react-router` 1.170.17
**Citation:** [spec-writer_4: app/node_modules/@tanstack/react-router/dist/esm/useRouterState.d.ts — `select?: (state: RouterState<...>) => ...`, returns `TSelected` when `select` is supplied]

`useRouterState({ select })` projects the router state to a derived slice and subscribes to it. The payload passed as `navigate({ state })` is reachable at `state.location.state`. Supplying `select` narrows the return type to the projection, so a component reading one flag re-renders only on that flag's changes rather than on every router state change.

## Route files carry no search-param validation unless `validateSearch` is declared

**Verified at:** `@tanstack/react-router` 1.170.17
**Citation:** [architect_3: app/src/routes/adventure.$adventureId.npc.$npcId.tsx — read, contains only `component`]

Every route file under `app/src/routes/` currently declares only `component` in its `createFileRoute` options. Typed search params require adding `validateSearch` to each route individually; there is no app-wide default.

## `vite build` regenerates `src/routeTree.gen.ts` from the route files

**Verified at:** `@tanstack/router-plugin` 1.168.19 (devDependency in `app/package.json`), registered as `tanstackRouter({ target: 'react', autoCodeSplitting: true })` in `app/vite.config.ts`
**Citation:** [spec-writer_1: ran `npx vite build` from `app/` after adding a scratch route file `src/routes/adventure.$adventureId.scratchprobe.tsx` — `src/routeTree.gen.ts` gained 13 `scratchprobe` occurrences; after deleting the scratch file and re-running, 0 remained]

The plugin rewrites `src/routeTree.gen.ts` during the Vite build, so a newly added route file needs no manual editing of the generated tree — running `npm run build:frontend` (which is `vite build`) is sufficient to make `npx tsc --noEmit` see the new route ids. The package installs no CLI binary (`app/node_modules/.bin` contains no router generator), so the Vite build is the only regeneration entry point that does not require the Tauri dev environment. The file is gitignored (`app/.gitignore:30`) and the regeneration writes nothing else into the working tree.

## `defaultPreload: 'intent'` fires only on `<Link>` hover/touchstart, not on imperative `navigate()`

**Verified at:** `@tanstack/react-router` 1.170.17
**Citation:** [plan-feature_12: https://tanstack.com/router/latest/docs/framework/react/guide/preloading — "works by using hover and touch start events on `<Link>` components to preload the dependencies for the destination route"; option type `defaultPreload?: false | 'intent' | 'viewport' | 'render'` at app/node_modules/@tanstack/router-core/dist/esm/router.d.ts:79]

Intent preloading is bound to the `<Link>` component's own DOM events. Navigation performed imperatively via `useNavigate()` or `router.navigate()` has no hover phase the router can observe, so intent preloading never fires for those call sites. The delay before preloading starts defaults to 50 ms (`defaultPreloadDelay`, router.d.ts:87) and preloaded data is considered fresh for 30 s by default (`defaultPreloadStaleTime`, router.d.ts:136). Preloading executes each route's `beforeLoad`/`loader` with a `preload: true` flag but does **not** load the route's JS chunk — that requires `loadRouteChunk` separately.

## Route `loader`s run on every navigation; the pending component appears only after 1000 ms

**Verified at:** `@tanstack/react-router` 1.170.17
**Citation:** [plan-feature_13: https://tanstack.com/router/latest/docs/framework/react/guide/data-loading — "TanStack Router will show a pending component for loaders that take longer than 1 second to resolve"; `defaultPendingMs?: number` and `defaultPendingMinMs?: number` at app/node_modules/@tanstack/router-core/dist/esm/router.d.ts:103,111; `loader?:` at app/node_modules/@tanstack/router-core/dist/esm/route.d.ts:258]

Unlike preloading, a route's `loader` runs on every navigation regardless of whether it originated from `<Link>` or an imperative `navigate()`. `defaultPendingMs` defaults to 1000 ms and `defaultPendingMinMs` to 500 ms, so a loader resolving faster than one second renders no pending component at all. The docs do not state explicitly whether the previous route's component stays mounted during that sub-threshold window — verify empirically before relying on that specific behavior.

## `createRootRouteWithContext` is exported for typing router-level context

**Verified at:** `@tanstack/react-router` 1.170.17
**Citation:** [plan-feature_14: app/node_modules/@tanstack/react-router/dist/esm/index.d.ts:23 — exports `createRootRoute, createRootRouteWithContext` among others]

Typed router context (e.g. passing a `QueryClient` into `createRouter({ context })` so `loader`s can reach it) requires the root route to be declared with `createRootRouteWithContext<TContext>()(...)` rather than `createRootRoute(...)`.
