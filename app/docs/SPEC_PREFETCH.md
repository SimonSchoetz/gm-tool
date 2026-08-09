# SPEC — Prefetching / no loading-induced layout jumps

## Progress tracker

- Sub-feature 1: Router-owned query client — hoist the `QueryClient` above the router and expose it as typed router context
- Sub-feature 2: Query options extraction — one `queryOptions`-built definition per domain, shared by hooks and loaders
- Sub-feature 3: Layout-stable image placeholder — `ImageById` holds its box while pending
- Sub-feature 4: List route loaders — resolve collection data before list screens mount
- Sub-feature 5: Detail route loaders — resolve entity data and paint the image before detail screens mount
- Sub-feature 6: Mention popup prefetch — warm popup content inside the existing hover delay

Sub-feature files:

- [SF1](./SPEC_PREFETCH_SF1.md)
- [SF2](./SPEC_PREFETCH_SF2.md)
- [SF3](./SPEC_PREFETCH_SF3.md)
- [SF4](./SPEC_PREFETCH_SF4.md)
- [SF5](./SPEC_PREFETCH_SF5.md)
- [SF6](./SPEC_PREFETCH_SF6.md)

## Key Architectural Decisions

### The defect is async-on-mount, not slow data

The database is local SQLite and queries resolve in single-digit milliseconds, but they resolve asynchronously. Every screen mount therefore has at least one render where `isPending` is true, and every screen early-returns a full-content spinner on that render. The fix is to make `isPending` false on the first render by resolving data before the component mounts — not to make anything faster. This is why a hover-triggered prefetch alone is insufficient: a click with no hover dwell still produces a one-to-two-frame spinner flash, which is the most visually disruptive form of the defect.

### The query client is owned above the router

`QueryClient` construction moves out of `TanstackQueryClientProvider.tsx` into its own module and is passed into `createRouter` as typed context. Route loaders execute outside React and cannot reach a client provided by a component rendered *inside* the router. `TanstackQueryClientProvider` consequently wraps `RouterProvider` in `main.tsx` rather than being rendered by `App`. One concern per file (`app/CLAUDE.md` — File Organization) governs the split: the client instance and the provider component are two concerns, and `main.tsx` needs the instance without the component.

### Loaders, not preloading, carry the guarantee

Route `loader`s run on every navigation regardless of origin. `defaultPreload: 'intent'` fires only on `<Link>` hover/touchstart and never on imperative `navigate()`, which is how list rows and mention badges navigate. `defaultPreload: 'intent'` is still enabled because it additively warms the `<Link>` surfaces (breadcrumbs, sidebar nav) ahead of the loader, but it is not the mechanism the acceptance criteria depend on.

### `queryOptions`-built factories are the shared definition

Each domain exposes a `queryOptions`-built factory consumed by both its React hook and its route loader, so one definition serves both and the query key is never re-declared. `app/src/CLAUDE.md` — Barrel Files permits exporting such a factory from a data-access-layer barrel precisely for consumers structurally unable to call a hook; it continues to ban exporting the raw key factory or a hand-assembled `{ queryKey, queryFn }` object. The factory must be built with `queryOptions()` — an ad hoc object literal does not satisfy the carve-out.

### Detail queries keep their freshness options; list queries keep the defaults

Detail hooks declare `staleTime: 0` and `refetchOnMount: 'always'`; list hooks rely on the `QueryClient` default `staleTime` of five minutes. These differences are deliberate and must be carried into the extracted factories unchanged. `refetchOnMount: 'always'` causes a background refetch when a detail screen mounts against a warm cache, but `isPending` stays false whenever cached data exists, so the refetch is invisible and produces no loading branch.

### Image readiness is solved per surface, not uniformly

Two distinct surfaces need different treatment. A detail screen has one large image whose arrival dominates the layout, so its loader resolves the image query and awaits `decode()` before returning. A list screen has one avatar per row; awaiting *N* decodes would stall navigation past the 1000 ms `defaultPendingMs` threshold and trade the flicker for a visible delay. List rows are instead made immune to timing by giving `ImageById` a pending state that occupies the same box as the loaded image. Because that placeholder fixes the layout for every consumer, it also covers popup images and any future surface.

### Screens keep their pending early-returns

The `if (loading) return <LoadingIcon />` branch in each screen is not removed. Loaders make it unreachable on route entry but not unconditionally: `enabled:` guards, cache eviction, and hooks mounted outside a route (mention popup content) still produce pending states, and with `throwOnError: true` this branch is the guard against rendering against absent data. Its continued presence is intentional, not dead code.

### The popup warms with `prefetchQuery`, not `ensureQueryData`

The mention popup is not a route. Its warm-up is speculative — the user may never open the popup — so it uses `prefetchQuery`, which returns `Promise<void>` and swallows errors. A failed speculative fetch must never surface to the Error Boundary or block the hover interaction. The DAL hook therefore exposes a `void`-returning function and callers never await it.

## CLAUDE.md impact

- `app/docs/_product/domain-scaffold.md` does not list a route loader as a per-entity-type registration point. After this spec, every entity type requires one, and an entity added without one silently reintroduces the loading flicker on its screens only. This file is edited directly as part of SF5 rather than deferred — see SF5's Files affected. [spec_1: app/docs/_product/domain-scaffold.md — as of 6ebbf7d6]
- `app/src/CLAUDE.md`'s State Management section documents the data-access-layer file split as "query keys, single-entity hooks, and collection hooks each own a separate file". This spec adds a fourth file kind to every domain module (`<domain>QueryOptions.ts`), so that enumeration no longer describes the layer. [spec_2: app/src/CLAUDE.md — State Management & Error Handling, as of 6ebbf7d6]
- `app/src/CLAUDE.md`'s Structure tree describes `routes/` as "Tanstack router" with no mention that route files now own data resolution. Route files gain a `loader` responsibility that the tree comment does not convey. [spec_3: app/src/CLAUDE.md — Structure, as of 6ebbf7d6]
- `MentionPopupContent` switches over eight mention entity types, and SF6 adds `mentionPrefetchByType` keyed by that same set. Mention entity type is now enumerated in two places that must stay in sync, with no documented registration flow naming either as canonical; adding a ninth mentionable entity requires updating both, and no check enforces it. The two sites serve different concerns — rendering versus cache warming — so merging them is not the resolution. [spec_4: app/src/components/MentionPopup/components/MentionPopupContent/MentionPopupContent.tsx:24-51, as of 6ebbf7d6]

## Out of scope

These are excluded deliberately; do not implement them.

- **Cold start** — the first-ever load of data never previously fetched. No prior navigation exists to prefetch from.
- **The settings route** — `SettingsScreen` renders its three sections unconditionally and has no top-level pending gate, so there is no full-screen loading swap to remove. Its sections own independent loading states, and `DevicesSection` reads live connectivity (`useOwnDevice`), which navigation must never gate on. No loader is added to `settings.tsx`.
- **Lexical editor mount cost** — `TextEditor` receives its content as a prop from the already-fetched entity, so a warm entity query leaves nothing to prefetch. Any residual mount-time jump is not a data-loading problem.
- **Mutation and invalidation behavior** — unchanged everywhere.
- **`useMentionEntityData`'s `staleTime: 0` / `refetchOnMount: 'always'`** — its refetch is invisible because `MentionBadge` falls back to `displayName` while loading.
- **Converting any imperative `navigate()` call site to `<Link>`** — loaders cover them.
- **Adding a `pendingComponent` or lowering `defaultPendingMs`** — the 1000 ms default is what produces the no-spinner outcome on a local database.

## Testing

This spec adds no files under `ComponentName/helper/` or `/src/util/`, the two locations the Testing Policy requires tests for. Every new construct lands in `data-access-layer/` (query options factories, `ensureImagePainted`, `mentionPrefetchByType`, `usePrefetchMentionEntity`) or in `routes/`, and the one modified component is a React component, which the Testing Policy forbids unit-testing. No automated tests are therefore required by rule, and none should be added speculatively.

Coverage for this feature is behavioral and lives in the per-sub-feature verification sections. Every check requires `npm run dev`: `npm run web` cannot reach the database at all, so it can exercise none of this.

## Manual verification

`[MANUAL-VERIFY]` Whether the previous route's component remains mounted during a sub-1000 ms loader resolution is not documented by TanStack Router. After SF5, navigate between two entity detail screens and confirm the outgoing screen stays painted until the incoming one renders. If the viewport instead goes blank between routes, the layout jump has moved rather than been removed, and a `pendingComponent` preserving layout geometry is required — surface this rather than implementing one unprompted, since it contradicts the Out of scope list above.
