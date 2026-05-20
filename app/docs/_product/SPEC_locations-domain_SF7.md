# SF7: Breadcrumbs + Seed

Wire the Location domain into the breadcrumb system and seed the table config. Depends on
SF6 (`useLocation` available via `@/data-access-layer`). All breadcrumb changes are applied
atomically in this SF — do not run baseline checks after individual file edits within this
SF, only after all files in this SF are complete.

## Files Affected

```
New:
  app/src/components/Header/components/BreadcrumbList/components/LocationCrumb.tsx

Modified:
  app/src/components/Header/components/BreadcrumbList/components/index.ts
    — add LocationCrumb export
  app/src/components/Header/helper/buildBreadcrumbs.ts
    — extend BreadcrumbConfig union; add locations and location route cases
  app/src/components/Header/helper/__tests__/buildBreadcrumbs.test.ts
    — add assertions for both new route IDs (observable behavior change)
  app/src/components/Header/components/BreadcrumbList/BreadcrumbList.tsx
    — add LocationCrumb import; add 'location' case to renderCrumb switch
  app/db/table-config/seed.ts
    — add Location type import, locationsConfig constant, locationsConfig to defaultConfigs
```

## Frontend Layer — Breadcrumbs

### `app/src/components/Header/components/BreadcrumbList/components/LocationCrumb.tsx`

**Purpose**: Renders the breadcrumb link for a location detail page, displaying the
location's name fetched from the cache.

**Behavior**: Reads `adventureId` and `locationId` from `useParams({ strict: false })`.
Calls `useLocation(locationId ?? '', adventureId ?? '')`. Displays `location?.name ?? '…'`.

```tsx
import { Link, useParams } from '@tanstack/react-router';
import { useLocation } from '@/data-access-layer';

export const LocationCrumb = () => {
  const { adventureId, locationId } = useParams({ strict: false });
  const { location } = useLocation(locationId ?? '', adventureId ?? '');

  return (
    <Link
      to='/adventure/$adventureId/location/$locationId'
      params={{ adventureId: adventureId ?? '', locationId: locationId ?? '' }}
    >
      {location?.name ?? '…'}
    </Link>
  );
};
```

### `app/src/components/Header/components/BreadcrumbList/components/index.ts` changes

Add after the existing `FoeCrumb` export:

```ts
export { LocationCrumb } from './LocationCrumb';
```

### `app/src/components/Header/helper/buildBreadcrumbs.ts` changes

**Extend `BreadcrumbConfig` union** — add `| { kind: 'location' }` after `| { kind: 'foe' }`:

```ts
export type BreadcrumbConfig =
  | { kind: 'static'; label: string; to: string; params: Record<string, string> }
  | { kind: 'adventure' }
  | { kind: 'session' }
  | { kind: 'npc' }
  | { kind: 'foe' }
  | { kind: 'location' };
```

**Add two cases** to the `buildBreadcrumbs` switch, after the Foe cases:

```ts
case '/adventure/$adventureId/locations':
  return [
    {
      kind: 'static',
      label: 'Locations',
      to: '/adventure/$adventureId/locations',
      params: { adventureId: p.adventureId },
    },
  ];
case '/adventure/$adventureId/location/$locationId':
  return [
    {
      kind: 'static',
      label: 'Locations',
      to: '/adventure/$adventureId/locations',
      params: { adventureId: p.adventureId },
    },
    { kind: 'location' },
  ];
```

### `app/src/components/Header/helper/__tests__/buildBreadcrumbs.test.ts` changes

Add test cases covering the two new route IDs. Required assertions:

- `routeId: '/adventure/$adventureId/locations'` with `params: { adventureId: 'adv-1' }`
  produces `[{ kind: 'static', label: 'Locations', to: '/adventure/$adventureId/locations', params: { adventureId: 'adv-1' } }]`
- `routeId: '/adventure/$adventureId/location/$locationId'` with
  `params: { adventureId: 'adv-1', locationId: 'location-1' }` produces
  `[{ kind: 'static', label: 'Locations', to: '/adventure/$adventureId/locations', params: { adventureId: 'adv-1' } }, { kind: 'location' }]`

Follow the existing test structure in the file for mock setup and assertion style.

### `app/src/components/Header/components/BreadcrumbList/BreadcrumbList.tsx` changes

Add `LocationCrumb` to the named import from `'./components'`:

```ts
import { AdventureCrumb, SessionCrumb, NpcCrumb, FoeCrumb, LocationCrumb } from './components';
```

Add a `case 'location':` block to the `renderCrumb` switch, after the `case 'foe':` block:

```ts
case 'location':
  listItem = (
    <li key={`${index}-${item.kind}`}>
      <LocationCrumb />
    </li>
  );
  break;
```

## DB Layer — Seed

### `app/db/table-config/seed.ts` changes

Add `Location` type import alongside existing type imports:

```ts
import type { Location } from '@db/location';
```

Add `locationsConfig` constant after `foesConfig`:

```ts
const locationsConfig: TypedCreateTableConfigInput<Location> = {
  table_name: 'locations',
  color: '#2ecc71',
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

Add `locationsConfig` to the `defaultConfigs` array, after `foesConfig`:

```ts
const defaultConfigs: CreateTableConfigInput[] = [
  adventuresConfig,
  npcsConfig,
  foesConfig,
  locationsConfig,
  sessionsConfig,
];
```
