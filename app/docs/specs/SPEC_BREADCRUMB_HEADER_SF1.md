# SF1: buildBreadcrumbs Helper

Create the pure mapping function, its type definitions, the helper barrel, and the required test.

## Files Affected

**New:**

- `app/src/components/Header/helper/buildBreadcrumbs.ts`
- `app/src/components/Header/helper/index.ts`
- `app/src/components/Header/helper/__tests__/buildBreadcrumbs.test.ts`

## Frontend

### buildBreadcrumbs.ts

**Purpose:** Pure function that converts an array of active route matches into a flat `BreadcrumbConfig[]` used by `BreadcrumbList` to render the breadcrumb trail.

**Behavior:**

Define `BreadcrumbConfig` as a discriminated union in this file:

```ts
export type BreadcrumbConfig =
  | { kind: 'static'; label: string; to: string; params: Record<string, string> }
  | { kind: 'adventure' }
  | { kind: 'session' }
  | { kind: 'npc' };
```

Export one function:

```ts
export const buildBreadcrumbs = (matches: AnyRouteMatch[]): BreadcrumbConfig[]
```

Import `AnyRouteMatch` from `@tanstack/react-router`. [S_1: app/node_modules/@tanstack/react-router/dist/esm/index.d.ts:13]

The function iterates over every match, applies the mapping table below, and returns a single flat array (flatMap behaviour — each match contributes 0–2 items).

**Filtering:** Skip any match where `match.routeId` is `'__root__'` or `'/'`. These are always present and produce no breadcrumb items.

**Mapping table** (every `routeId` not listed here produces no items):

| `match.routeId` | Items produced |
|---|---|
| `/adventures` | `[{ kind: 'static', label: 'Adventures', to: '/adventures', params: {} }]` |
| `/settings` | `[{ kind: 'static', label: 'Settings', to: '/settings', params: {} }]` |
| `/adventure/$adventureId` | `[{ kind: 'static', label: 'Adventures', to: '/adventures', params: {} }, { kind: 'adventure' }]` |
| `/adventure/$adventureId/npcs` | `[{ kind: 'static', label: 'NPCs', to: '/adventure/$adventureId/npcs', params: { adventureId: match.params.adventureId } }]` |
| `/adventure/$adventureId/npc/$npcId` | `[{ kind: 'static', label: 'NPCs', to: '/adventure/$adventureId/npcs', params: { adventureId: match.params.adventureId } }, { kind: 'npc' }]` |
| `/adventure/$adventureId/sessions` | `[{ kind: 'static', label: 'Sessions', to: '/adventure/$adventureId/sessions', params: { adventureId: match.params.adventureId } }]` |
| `/adventure/$adventureId/session/$sessionId` | `[{ kind: 'static', label: 'Sessions', to: '/adventure/$adventureId/sessions', params: { adventureId: match.params.adventureId } }, { kind: 'session' }]` |

`match.params` is typed `any` on `AnyRouteMatch` — cast to `Record<string, string>` before accessing named keys: `const p = match.params as Record<string, string>`.

**UI / Visual:** No UI — pure function.

---

### helper/index.ts

Grouping barrel for the `helper/` directory. Explicit named exports only — no `export *`.

```ts
export { buildBreadcrumbs } from './buildBreadcrumbs';
export type { BreadcrumbConfig } from './buildBreadcrumbs';
```

`BreadcrumbConfig` is exported here because `BreadcrumbList.tsx` (SF3) imports it to switch on `kind`.

---

### buildBreadcrumbs.test.ts

**Purpose:** Verify all route IDs in the mapping table and the filter behavior.

Import `AnyRouteMatch` from `@tanstack/react-router`. Use a factory helper to produce minimal mock matches:

```ts
const match = (routeId: string, params: Record<string, string> = {}): AnyRouteMatch =>
  ({ routeId, params } as unknown as AnyRouteMatch);
```

The cast to `unknown as AnyRouteMatch` is required because `AnyRouteMatch` has many fields not needed for the tests.

**Required test cases** — each uses `describe('buildBreadcrumbs')`:

1. **Filter:** `[match('__root__'), match('/')]` → result length `0`

2. **`/adventures`:** `[match('__root__'), match('/adventures')]` →
   - result length `1`
   - `result[0]` equals `{ kind: 'static', label: 'Adventures', to: '/adventures', params: {} }`

3. **`/settings`:** `[match('__root__'), match('/settings')]` →
   - result length `1`
   - `result[0]` equals `{ kind: 'static', label: 'Settings', to: '/settings', params: {} }`

4. **`/adventure/$adventureId`:** `[match('__root__'), match('/adventure/$adventureId', { adventureId: 'adv1' })]` →
   - result length `2`
   - `result[0]` equals `{ kind: 'static', label: 'Adventures', to: '/adventures', params: {} }`
   - `result[1]` equals `{ kind: 'adventure' }`

5. **`/adventure/$adventureId/npcs`:** `[match('__root__'), match('/adventure/$adventureId', { adventureId: 'adv1' }), match('/adventure/$adventureId/npcs', { adventureId: 'adv1' })]` →
   - result length `3`
   - `result[2]` equals `{ kind: 'static', label: 'NPCs', to: '/adventure/$adventureId/npcs', params: { adventureId: 'adv1' } }`

6. **`/adventure/$adventureId/npc/$npcId`:** `[match('__root__'), match('/adventure/$adventureId', { adventureId: 'adv1' }), match('/adventure/$adventureId/npc/$npcId', { adventureId: 'adv1', npcId: 'npc1' })]` →
   - result length `4`
   - `result[2]` equals `{ kind: 'static', label: 'NPCs', to: '/adventure/$adventureId/npcs', params: { adventureId: 'adv1' } }`
   - `result[3]` equals `{ kind: 'npc' }`

7. **`/adventure/$adventureId/sessions`:** `[match('__root__'), match('/adventure/$adventureId', { adventureId: 'adv1' }), match('/adventure/$adventureId/sessions', { adventureId: 'adv1' })]` →
   - result length `3`
   - `result[2]` equals `{ kind: 'static', label: 'Sessions', to: '/adventure/$adventureId/sessions', params: { adventureId: 'adv1' } }`

8. **`/adventure/$adventureId/session/$sessionId`:** `[match('__root__'), match('/adventure/$adventureId', { adventureId: 'adv1' }), match('/adventure/$adventureId/session/$sessionId', { adventureId: 'adv1', sessionId: 'sess1' })]` →
   - result length `4`
   - `result[2]` equals `{ kind: 'static', label: 'Sessions', to: '/adventure/$adventureId/sessions', params: { adventureId: 'adv1' } }`
   - `result[3]` equals `{ kind: 'session' }`

9. **Unknown routeId is silently ignored:** `[match('/unknown-route')]` → result length `0`

Use `expect(...).toEqual(...)` for structural equality checks on individual items.
