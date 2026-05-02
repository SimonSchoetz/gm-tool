# SF3: BreadcrumbList

Create the `BreadcrumbList` component and its CSS file. This is the orchestrating component: it calls `useMatches`, converts to `BreadcrumbConfig[]`, and renders each item.

## Files Affected

**New:**

- `app/src/components/Header/components/BreadcrumbList.tsx`
- `app/src/components/Header/components/BreadcrumbList.css`

**Modified:**

- `app/src/components/Header/components/index.ts` — add `BreadcrumbList` export (barrel was created in SF2)

## Frontend

### BreadcrumbList.tsx

**Purpose:** Renders the full breadcrumb trail as a `<nav>` element. Orchestrates `useMatches`, `buildBreadcrumbs`, and the crumb sub-components. Has no external props.

**Behavior:**

- Call `useMatches()` from `@tanstack/react-router`. [S_1: app/node_modules/@tanstack/react-router/dist/esm/Matches.d.ts:47] The return type is `Array<MakeRouteMatchUnion<RegisteredRouter>>`. Pass it to `buildBreadcrumbs` with a type assertion: `buildBreadcrumbs(matches as AnyRouteMatch[])`. The cast is safe because `AnyRouteMatch` is `RouteMatch<any, …>` — a structurally compatible supertype.
- Import `buildBreadcrumbs` and `BreadcrumbConfig` from `'../helper'`. [S_2: SF1 barrel — `app/src/components/Header/helper/index.ts`]
- Import `AdventureCrumb`, `SessionCrumb`, `NpcCrumb` from `'./AdventureCrumb'`, `'./SessionCrumb'`, `'./NpcCrumb'` respectively (direct sibling imports — barrel access would be circular since this file is itself in `components/`).
- Map over the resulting `BreadcrumbConfig[]` and render:
  - `kind: 'static'` → `<Link to={item.to} params={item.params}>{item.label}</Link>` wrapped in a `<li className="breadcrumb-item">`.
  - `kind: 'adventure'` → `<AdventureCrumb />` wrapped in `<li className="breadcrumb-item">`.
  - `kind: 'session'` → `<SessionCrumb />` wrapped in `<li className="breadcrumb-item">`.
  - `kind: 'npc'` → `<NpcCrumb />` wrapped in `<li className="breadcrumb-item">`.
- Each `<li>` needs a stable `key`. Use the item's array index combined with `item.kind` (and `item.to` for static items, since multiple static items can appear in one route): `key={index}` is acceptable here since the array is deterministic for a given route — it does not reorder on user interaction.
- Wrap the `<li>` list in an `<ol className="breadcrumb-list">`, wrapped in a `<nav>`.
- If `buildBreadcrumbs` returns an empty array, render `<nav />` (empty nav — this only occurs on unrecognised routes, not in normal app navigation).

**TypeScript note for `Link`:** When TypeScript rejects `to={item.to}` or `params={item.params}` because the generic `to: string` type does not satisfy the router's route-path constraint, apply the cast `to={item.to as string}`. `params` typed as `Record<string, string>` should be accepted without a cast since TanStack Router's Link accepts loose param types when `to` resolves to the base `string` type.

**UI / Visual:**

- `<nav>` is the semantic landmark for navigation.
- `<ol>` (`breadcrumb-list` class): `display: flex`, `align-items: center`, `list-style: none`, `margin: 0`, `padding: 0`, gap provided via the separator pseudo-element spacing.
- `<li>` (`breadcrumb-item` class): `display: flex`, `align-items: center`. Every `<li>` except the first gets a `>` separator before it via CSS `+ .breadcrumb-item::before` (see CSS below).
- Link elements render as `<a>` tags via TanStack Router's `Link` component. No additional styling is applied to links in this component — defer link appearance to global or inherited styles.

**Props:** None. `type Props = Record<string, never>`. Typed as `FCProps<Props>`.

**Imports:**
- `useMatches, Link, AnyRouteMatch` from `@tanstack/react-router` [S_3: app/node_modules/@tanstack/react-router/dist/esm/index.d.ts:13,15]
- `buildBreadcrumbs, BreadcrumbConfig` from `'../helper'`
- `AdventureCrumb` from `'./AdventureCrumb'`
- `SessionCrumb` from `'./SessionCrumb'`
- `NpcCrumb` from `'./NpcCrumb'`
- `FCProps` from `@/types`
- `'./BreadcrumbList.css'`

---

### BreadcrumbList.css

Styles for the breadcrumb nav. All values reference tokens from `styles/variables.css`. [S_4: app/src/styles/variables.css]

```css
.breadcrumb-list {
  display: flex;
  align-items: center;
  list-style: none;
  margin: 0;
  padding: 0;
}

.breadcrumb-item {
  display: flex;
  align-items: center;
}

.breadcrumb-item + .breadcrumb-item::before {
  content: '>';
  padding: 0 var(--spacing-xs);
  color: var(--color-text-muted);
}
```

`--spacing-xs` and `--color-text-muted` both exist in `variables.css`. [S_5: app/src/styles/variables.css:51, app/src/styles/variables.css:37]

---

### components/index.ts (modification)

Add the `BreadcrumbList` export. Final barrel content:

```ts
export { BreadcrumbList } from './BreadcrumbList';
export { AdventureCrumb } from './AdventureCrumb';
export { SessionCrumb } from './SessionCrumb';
export { NpcCrumb } from './NpcCrumb';
```
