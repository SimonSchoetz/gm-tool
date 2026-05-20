# SF7: Breadcrumbs + Seed

Wire the Faction domain into the breadcrumb system and seed the table config. Depends on
SF6 (`useFaction` available via `@/data-access-layer`). All breadcrumb changes are applied
atomically in this SF — do not run baseline checks after individual file edits within this
SF, only after all files in this SF are complete.

## Files Affected

```
New:
  app/src/components/Header/components/BreadcrumbList/components/FactionCrumb.tsx

Modified:
  app/src/components/Header/components/BreadcrumbList/components/index.ts
    — add FactionCrumb export
  app/src/components/Header/helper/buildBreadcrumbs.ts
    — extend BreadcrumbConfig union; add factions and faction route cases
  app/src/components/Header/helper/__tests__/buildBreadcrumbs.test.ts
    — add assertions for both new route IDs (observable behavior change)
  app/src/components/Header/components/BreadcrumbList/BreadcrumbList.tsx
    — add FactionCrumb import; add 'faction' case to renderCrumb switch
  app/db/table-config/seed.ts
    — add Faction type import, factionsConfig constant, factionsConfig to defaultConfigs
```

## Frontend Layer — Breadcrumbs

### `app/src/components/Header/components/BreadcrumbList/components/FactionCrumb.tsx`

**Purpose**: Renders the breadcrumb link for a faction detail page, displaying the
faction's name fetched from the cache.

**Behavior**: Reads `adventureId` and `factionId` from `useParams({ strict: false })`.
Calls `useFaction(factionId ?? '', adventureId ?? '')`. Displays `faction?.name ?? '…'`.

```tsx
import { Link, useParams } from '@tanstack/react-router';
import { useFaction } from '@/data-access-layer';

export const FactionCrumb = () => {
  const { adventureId, factionId } = useParams({ strict: false });
  const { faction } = useFaction(factionId ?? '', adventureId ?? '');

  return (
    <Link
      to='/adventure/$adventureId/faction/$factionId'
      params={{ adventureId: adventureId ?? '', factionId: factionId ?? '' }}
    >
      {faction?.name ?? '…'}
    </Link>
  );
};
```

### `app/src/components/Header/components/BreadcrumbList/components/index.ts` changes

Add after the existing `FoeCrumb` export:

```ts
export { FactionCrumb } from './FactionCrumb';
```

### `app/src/components/Header/helper/buildBreadcrumbs.ts` changes

**Extend `BreadcrumbConfig` union** — add `| { kind: 'faction' }` after `| { kind: 'foe' }`:

```ts
export type BreadcrumbConfig =
  | { kind: 'static'; label: string; to: string; params: Record<string, string> }
  | { kind: 'adventure' }
  | { kind: 'session' }
  | { kind: 'npc' }
  | { kind: 'foe' }
  | { kind: 'faction' };
```

**Add two cases** to the `buildBreadcrumbs` switch, after the Foe cases:

```ts
case '/adventure/$adventureId/factions':
  return [
    {
      kind: 'static',
      label: 'Factions',
      to: '/adventure/$adventureId/factions',
      params: { adventureId: p.adventureId },
    },
  ];
case '/adventure/$adventureId/faction/$factionId':
  return [
    {
      kind: 'static',
      label: 'Factions',
      to: '/adventure/$adventureId/factions',
      params: { adventureId: p.adventureId },
    },
    { kind: 'faction' },
  ];
```

### `app/src/components/Header/helper/__tests__/buildBreadcrumbs.test.ts` changes

Add test cases covering the two new route IDs. Required assertions:

- `routeId: '/adventure/$adventureId/factions'` with `params: { adventureId: 'adv-1' }`
  produces `[{ kind: 'static', label: 'Factions', to: '/adventure/$adventureId/factions', params: { adventureId: 'adv-1' } }]`
- `routeId: '/adventure/$adventureId/faction/$factionId'` with
  `params: { adventureId: 'adv-1', factionId: 'faction-1' }` produces
  `[{ kind: 'static', label: 'Factions', to: '/adventure/$adventureId/factions', params: { adventureId: 'adv-1' } }, { kind: 'faction' }]`

Follow the existing test structure in the file for mock setup and assertion style.

### `app/src/components/Header/components/BreadcrumbList/BreadcrumbList.tsx` changes

Add `FactionCrumb` to the named import from `'./components'`:

```ts
import { AdventureCrumb, SessionCrumb, NpcCrumb, FoeCrumb, FactionCrumb } from './components';
```

Add a `case 'faction':` block to the `renderCrumb` switch, after the `case 'foe':` block:

```ts
case 'faction':
  listItem = (
    <li key={`${index}-${item.kind}`}>
      <FactionCrumb />
    </li>
  );
  break;
```

## DB Layer — Seed

### `app/db/table-config/seed.ts` changes

Add `Faction` type import alongside existing type imports:

```ts
import type { Faction } from '@db/faction';
```

Add `factionsConfig` constant after `foesConfig`:

```ts
const factionsConfig: TypedCreateTableConfigInput<Faction> = {
  table_name: 'factions',
  color: '#f39c12',
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

Add `factionsConfig` to the `defaultConfigs` array, after `foesConfig`:

```ts
const defaultConfigs: CreateTableConfigInput[] = [
  adventuresConfig,
  npcsConfig,
  foesConfig,
  factionsConfig,
  sessionsConfig,
];
```
