# Spec: Breadcrumb Header

## Progress Tracker

- SF1: buildBreadcrumbs helper — pure mapping function + test
- SF2: Crumb sub-components — AdventureCrumb, SessionCrumb, NpcCrumb
- SF3: BreadcrumbList — renders breadcrumb nav using useMatches + buildBreadcrumbs
- SF4: Header refactor — strips regex logic, renders BreadcrumbList

## Key Architectural Decisions

### useMatches replaces useRouterState + regex

`useMatches()` from `@tanstack/react-router` returns the full array of active route matches, each carrying its accumulated `params` object. This eliminates the brittle regex URL parsing currently in `Header.tsx` and replaces it with structured match data. `AnyRouteMatch` (re-exported from `@tanstack/react-router` via `@tanstack/router-core`) is the correct type for the function input — it is `RouteMatch<any, any, any, any, any, any, any>`, giving access to `routeId: string` and `params: any` without coupling to specific route generics. [S_1: app/node_modules/@tanstack/router-core/dist/esm/Matches.d.ts:43,81,105]

### Match-per-item flatMap architecture

`buildBreadcrumbs` processes each match independently and returns 0–2 items per match. The full breadcrumb list is the concatenation of all per-match results. On a route like `/adventure/$adventureId/npc/$npcId`, TanStack Router produces matches `[__root__, /, /adventure/$adventureId, /adventure/$adventureId/npc/$npcId]`. After filtering `__root__` and `/`, the function processes two matches and produces four items: [Adventures link, adventure crumb, NPCs link, npc crumb]. Route files confirm these exact routeId strings. [S_2: app/src/routes/adventure.$adventureId.tsx:3, app/src/routes/adventure.$adventureId.npc.$npcId.tsx:3]

### adventure.$adventureId.index.tsx produces routeId `/adventure/$adventureId/`

The file `adventure.$adventureId.tsx` is a layout route with routeId `/adventure/$adventureId`. The file `adventure.$adventureId.index.tsx` is the actual adventure detail page with routeId `/adventure/$adventureId/` (trailing slash). Both matches appear when on the adventure detail page. `buildBreadcrumbs` maps `/adventure/$adventureId` to [static Adventures, adventure crumb] and produces nothing for `/adventure/$adventureId/` (not in the table — falls through silently). [S_3: app/src/routes/adventure.$adventureId.index.tsx:3]

### BreadcrumbConfig as discriminated union

Static items (fixed label, no data fetch) and entity items (dynamic label from data) have incompatible structures. A discriminated union on `kind` lets `BreadcrumbList` switch rendering without runtime shape-probing. `BreadcrumbConfig` is defined in `buildBreadcrumbs.ts` (its producer) and consumed by `BreadcrumbList.tsx` (its only consumer outside the file). Both live within the `Header/` module, so the type is exported from `buildBreadcrumbs.ts`, re-exported from the `helper/` barrel, and imported by `BreadcrumbList.tsx` — no domain layer involvement.

### Self-contained crumb components

Each entity crumb component calls `useParams({ strict: false })` and the appropriate DAL hook directly. This satisfies CLAUDE.md: "Framework context is not a prop — never relay a value as a prop when the receiving component can obtain it directly from a framework-managed context." `BreadcrumbList` renders `<AdventureCrumb />`, `<SessionCrumb />`, `<NpcCrumb />` with no props. [S_4: app/src/CLAUDE.md — State Management & Error Handling]

### CSS-only separators

No JSX nodes for the `>` separator between breadcrumb items. The `breadcrumb-item` class is applied to each `<li>`. The CSS rule `.breadcrumb-item + .breadcrumb-item::before` inserts the `>` separator as generated content before every item except the first. Flex gap provides horizontal spacing around the separator.

### Existing Header module barrel

`app/src/components/Header/index.ts` does not exist. [S_5: filesystem — not found] The public export of `Header` is provided by `app/src/components/index.ts` which imports directly from `./Header/Header.tsx`. [S_6: app/src/components/index.ts:21] This file is out of scope and must not be modified.

## Sub-feature Files

- [SF1 — buildBreadcrumbs helper](./SPEC_BREADCRUMB_HEADER_SF1.md)
- [SF2 — Crumb sub-components](./SPEC_BREADCRUMB_HEADER_SF2.md)
- [SF3 — BreadcrumbList](./SPEC_BREADCRUMB_HEADER_SF3.md)
- [SF4 — Header refactor](./SPEC_BREADCRUMB_HEADER_SF4.md)

## CLAUDE.md Impact

None.
