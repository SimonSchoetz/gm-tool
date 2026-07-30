# TanStack Router

## `navigate()` and `<Link>` accept a `state` option for non-URL navigation payloads

**Verified at:** `@tanstack/react-router` 1.170.17 (resolved in `app/node_modules/@tanstack/react-router/package.json`)
**Citation:** [A_1: app/node_modules/@tanstack/router-core/dist/esm/link.d.ts:126]

Navigation options expose `state?: true | NonNullableUpdater<ParsedHistoryState, HistoryState>`. This carries a payload through a navigation via the History API rather than the URL, so the value does not appear in the address bar and does not survive a page reload.

## `HistoryState` is an empty interface designed for declaration merging

**Verified at:** `@tanstack/history` (transitive dependency of `@tanstack/react-router` 1.170.17)
**Citation:** [A_2: app/node_modules/@tanstack/history/dist/esm/index.d.ts:41-48]

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
**Citation:** [S_4: app/node_modules/@tanstack/react-router/dist/esm/useRouterState.d.ts — `select?: (state: RouterState<...>) => ...`, returns `TSelected` when `select` is supplied]

`useRouterState({ select })` projects the router state to a derived slice and subscribes to it. The payload passed as `navigate({ state })` is reachable at `state.location.state`. Supplying `select` narrows the return type to the projection, so a component reading one flag re-renders only on that flag's changes rather than on every router state change.

## Route files carry no search-param validation unless `validateSearch` is declared

**Verified at:** `@tanstack/react-router` 1.170.17
**Citation:** [A_3: app/src/routes/adventure.$adventureId.npc.$npcId.tsx — read, contains only `component`]

Every route file under `app/src/routes/` currently declares only `component` in its `createFileRoute` options. Typed search params require adding `validateSearch` to each route individually; there is no app-wide default.
