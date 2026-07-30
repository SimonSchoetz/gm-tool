# SF2 — Breadcrumbs consume the registry

Replaces `BreadcrumbConfig`'s eight inlined entity variants with the canonical `EntityType` from SF1, eliminating the second independent encoding of the entity set.

## Files affected

**Modified:**

- `app/src/components/Header/helper/buildBreadcrumbs.ts` — `BreadcrumbConfig`'s entity variants collapse to one variant carrying `EntityType`; every returned entity crumb switches from the singular key to the plural key
- `app/src/components/Header/components/BreadcrumbList/BreadcrumbList.tsx` — `renderCrumb`'s switch cases change from singular to plural keys
- `app/src/components/Header/helper/__tests__/buildBreadcrumbs.test.ts` — every asserted entity `kind` value changes from singular to plural

**No change needed:**

- `app/src/components/Header/components/BreadcrumbList/components/index.ts` — the eight crumb components keep their current names and exports. Verified against the barrel convention in `app/src/CLAUDE.md`: it is a within-module grouping barrel using explicit named exports, which is correct as-is.

## Frontend layer

### `buildBreadcrumbs.ts`

**Purpose** — Maps the active route matches to an ordered breadcrumb description. It currently declares its own eight entity kinds, duplicating the canonical registry.

**Behavior** — `BreadcrumbConfig` becomes a two-variant union: the existing `static` variant unchanged, and a single entity variant typed `{ kind: EntityType }` replacing the eight one-off variants. Import `EntityType` from `@domain`.

Every entity crumb the function returns changes from the singular key to the plural key — `{ kind: 'npc' }` becomes `{ kind: 'npcs' }`, and likewise for `adventure`, `session`, `foe`, `item`, `faction`, `pc`, and `location`. The route-to-crumb mapping, the static crumbs, and the `__root__` / `/` early return are all unchanged.

This makes the singular route segment reachable from `ENTITY_SEGMENT` rather than being restated as a union member, which is the duplication this sub-feature removes.

**UI / Visual** — None. This file returns data; it renders nothing.

### `BreadcrumbList.tsx`

**Purpose** — Renders the breadcrumb trail, selecting a per-entity crumb component for each non-static config.

**Behavior** — `renderCrumb`'s `switch (item.kind)` cases change from singular to plural to match the new config values: `case 'adventures'` renders `<AdventureCrumb />`, `case 'sessions'` renders `<SessionCrumb />`, and so on for the remaining six. The `item.kind === 'static'` branch, the `BreadCrumbListItem` wrapper, the key expressions, and the `ChevronRightIcon` separator are all unchanged.

The switch remains exhaustive over `EntityType`. `noFallthroughCasesInSwitch` is active in `app/tsconfig.json`, so every case keeps its `break`.

**UI / Visual** — Unchanged. This sub-feature alters only the discriminator values the switch matches on; no markup, class name, or style changes.

## Tests

### `buildBreadcrumbs.test.ts`

Every assertion on an entity crumb's `kind` changes from the singular to the plural key. Assertions on `static` crumbs — their `label`, `to`, and `params` — are unchanged, as is the assertion that `__root__` and `/` produce no crumbs.

`BreadcrumbList.tsx` gets no test: it is a React component, and `app/src/CLAUDE.md`'s Testing Policy forbids unit tests for components.
