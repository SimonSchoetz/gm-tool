# SF7: Breadcrumbs + Seed

Wire the Foe domain into the breadcrumb system and seed the table config. Depends on
SF6 (`useFoe` available via `@/data-access-layer`). All breadcrumb changes are
applied atomically in this SF — do not run baseline checks after individual file edits
within this SF, only after all files in this SF are complete.

## Files Affected

```
New:
  app/src/components/Header/components/BreadcrumbList/components/FoeCrumb.tsx

Modified:
  app/src/components/Header/components/BreadcrumbList/components/index.ts
    — add FoeCrumb export
  app/src/components/Header/helper/buildBreadcrumbs.ts
    — extend BreadcrumbConfig union; add foes and foe route cases
  app/src/components/Header/helper/__tests__/buildBreadcrumbs.test.ts
    — add assertions for both new route IDs (observable behavior change)
  app/src/components/Header/components/BreadcrumbList/BreadcrumbList.tsx
    — add FoeCrumb import; add 'foe' case to renderCrumb switch
  app/db/table-config/seed.ts
    — add Foe type import, foesConfig constant, foesConfig to defaultConfigs
```

## Frontend Layer — Breadcrumbs

### `app/src/components/Header/components/BreadcrumbList/components/FoeCrumb.tsx`

**Purpose**: Renders the breadcrumb link for a foe detail page, displaying the foe's
name fetched from the cache.

**Behavior**: Reads `adventureId` and `foeId` from `useParams({ strict: false })`.
Calls `useFoe(foeId ?? '', adventureId ?? '')`. Displays `foe?.name ?? '…'`.

```tsx
import { Link, useParams } from '@tanstack/react-router';
import { useFoe } from '@/data-access-layer';

export const FoeCrumb = () => {
  const { adventureId, foeId } = useParams({ strict: false });
  const { foe } = useFoe(foeId ?? '', adventureId ?? '');

  return (
    <Link
      to='/adventure/$adventureId/foe/$foeId'
      params={{ adventureId: adventureId ?? '', foeId: foeId ?? '' }}
    >
      {foe?.name ?? '…'}
    </Link>
  );
};
```

### `app/src/components/Header/components/BreadcrumbList/components/index.ts` changes

Add after the existing `NpcCrumb` export:

```ts
export { FoeCrumb } from './FoeCrumb';
```

### `app/src/components/Header/helper/buildBreadcrumbs.ts` changes

**Extend `BreadcrumbConfig` union** — add `| { kind: 'foe' }` to the type:

```ts
export type BreadcrumbConfig =
  | { kind: 'static'; label: string; to: string; params: Record<string, string> }
  | { kind: 'adventure' }
  | { kind: 'session' }
  | { kind: 'npc' }
  | { kind: 'foe' };
```

**Add two cases** to the `buildBreadcrumbs` switch, after the NPC cases:

```ts
case '/adventure/$adventureId/foes':
  return [
    {
      kind: 'static',
      label: 'Foes',
      to: '/adventure/$adventureId/foes',
      params: { adventureId: p.adventureId },
    },
  ];
case '/adventure/$adventureId/foe/$foeId':
  return [
    {
      kind: 'static',
      label: 'Foes',
      to: '/adventure/$adventureId/foes',
      params: { adventureId: p.adventureId },
    },
    { kind: 'foe' },
  ];
```

### `app/src/components/Header/helper/__tests__/buildBreadcrumbs.test.ts` changes

Add test cases covering the two new route IDs. Required assertions:

- `routeId: '/adventure/$adventureId/foes'` with `params: { adventureId: 'adv-1' }`
  produces `[{ kind: 'static', label: 'Foes', to: '/adventure/$adventureId/foes', params: { adventureId: 'adv-1' } }]`
- `routeId: '/adventure/$adventureId/foe/$foeId'` with
  `params: { adventureId: 'adv-1', foeId: 'foe-1' }` produces
  `[{ kind: 'static', label: 'Foes', to: '/adventure/$adventureId/foes', params: { adventureId: 'adv-1' } }, { kind: 'foe' }]`

Follow the existing test structure in the file for mock setup and assertion style.

### `app/src/components/Header/components/BreadcrumbList/BreadcrumbList.tsx` changes

Add `FoeCrumb` to the named import from `'./components'`:

```ts
import { AdventureCrumb, SessionCrumb, NpcCrumb, FoeCrumb } from './components';
```

Add a `case 'foe':` block to the `renderCrumb` switch, after the `case 'npc':` block:

```ts
case 'foe':
  listItem = (
    <li key={`${index}-${item.kind}`}>
      <FoeCrumb />
    </li>
  );
  break;
```

## DB Layer — Seed

### `app/db/table-config/seed.ts` changes

Add `Foe` type import alongside existing type imports:

```ts
import type { Foe } from '@db/foe';
```

Add `foesConfig` constant after `npcsConfig`:

```ts
const foesConfig: TypedCreateTableConfigInput<Foe> = {
  table_name: 'foes',
  color: '#e67e22',
  tagging_enabled: 1,
  scope: 'adventure',
  layout: {
    searchable_columns: ['name', 'summary', 'description'],
    columns: [
      {
        key: 'image_id',
        label: 'Avatar',
        sortable: false,
        resizable: false,
        width: 136,
      },
      { key: 'name', label: 'Name', width: 250 },
      { key: 'created_at', label: 'Created At', width: 250 },
      { key: 'updated_at', label: 'Last updated', width: 250 },
    ],
    sort_state: { column: 'updated_at', direction: 'desc' },
  },
};
```

Add `foesConfig` to the `defaultConfigs` array, after `npcsConfig`:

```ts
const defaultConfigs: CreateTableConfigInput[] = [
  adventuresConfig,
  npcsConfig,
  foesConfig,
  sessionsConfig,
];
```
