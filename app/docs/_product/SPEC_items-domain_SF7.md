# SF7: Breadcrumbs + Seed

Wire the Item domain into the breadcrumb system and seed the table config. Depends on
SF6 (`useItem` available via `@/data-access-layer`). All breadcrumb changes are applied
atomically in this SF — do not run baseline checks after individual file edits within this
SF, only after all files in this SF are complete.

## Files Affected

```
New:
  app/src/components/Header/components/BreadcrumbList/components/ItemCrumb.tsx

Modified:
  app/src/components/Header/components/BreadcrumbList/components/index.ts
    — add ItemCrumb export
  app/src/components/Header/helper/buildBreadcrumbs.ts
    — extend BreadcrumbConfig union; add items and item route cases
  app/src/components/Header/helper/__tests__/buildBreadcrumbs.test.ts
    — add assertions for both new route IDs (observable behavior change)
  app/src/components/Header/components/BreadcrumbList/BreadcrumbList.tsx
    — add ItemCrumb import; add 'item' case to renderCrumb switch
  app/db/table-config/seed.ts
    — add Item type import, itemsConfig constant, itemsConfig to defaultConfigs
```

## Frontend Layer — Breadcrumbs

### `app/src/components/Header/components/BreadcrumbList/components/ItemCrumb.tsx`

**Purpose**: Renders the breadcrumb link for a item detail page, displaying the
item's name fetched from the cache.

**Behavior**: Reads `adventureId` and `itemId` from `useParams({ strict: false })`.
Calls `useItem(itemId ?? '', adventureId ?? '')`. Displays `item?.name ?? '…'`.

```tsx
import { Link, useParams } from '@tanstack/react-router';
import { useItem } from '@/data-access-layer';

export const ItemCrumb = () => {
  const { adventureId, itemId } = useParams({ strict: false });
  const { item } = useItem(itemId ?? '', adventureId ?? '');

  return (
    <Link
      to='/adventure/$adventureId/item/$itemId'
      params={{ adventureId: adventureId ?? '', itemId: itemId ?? '' }}
    >
      {item?.name ?? '…'}
    </Link>
  );
};
```

### `app/src/components/Header/components/BreadcrumbList/components/index.ts` changes

Add after the existing `FoeCrumb` export:

```ts
export { ItemCrumb } from './ItemCrumb';
```

### `app/src/components/Header/helper/buildBreadcrumbs.ts` changes

**Extend `BreadcrumbConfig` union** — add `| { kind: 'item' }` after `| { kind: 'foe' }`:

```ts
export type BreadcrumbConfig =
  | { kind: 'static'; label: string; to: string; params: Record<string, string> }
  | { kind: 'adventure' }
  | { kind: 'session' }
  | { kind: 'npc' }
  | { kind: 'foe' }
  | { kind: 'item' };
```

**Add two cases** to the `buildBreadcrumbs` switch, after the Foe cases:

```ts
case '/adventure/$adventureId/items':
  return [
    {
      kind: 'static',
      label: 'Items',
      to: '/adventure/$adventureId/items',
      params: { adventureId: p.adventureId },
    },
  ];
case '/adventure/$adventureId/item/$itemId':
  return [
    {
      kind: 'static',
      label: 'Items',
      to: '/adventure/$adventureId/items',
      params: { adventureId: p.adventureId },
    },
    { kind: 'item' },
  ];
```

### `app/src/components/Header/helper/__tests__/buildBreadcrumbs.test.ts` changes

Add test cases covering the two new route IDs. Required assertions:

- `routeId: '/adventure/$adventureId/items'` with `params: { adventureId: 'adv-1' }`
  produces `[{ kind: 'static', label: 'Items', to: '/adventure/$adventureId/items', params: { adventureId: 'adv-1' } }]`
- `routeId: '/adventure/$adventureId/item/$itemId'` with
  `params: { adventureId: 'adv-1', itemId: 'item-1' }` produces
  `[{ kind: 'static', label: 'Items', to: '/adventure/$adventureId/items', params: { adventureId: 'adv-1' } }, { kind: 'item' }]`

Follow the existing test structure in the file for mock setup and assertion style.

### `app/src/components/Header/components/BreadcrumbList/BreadcrumbList.tsx` changes

Add `ItemCrumb` to the named import from `'./components'`:

```ts
import { AdventureCrumb, SessionCrumb, NpcCrumb, FoeCrumb, ItemCrumb } from './components';
```

Add a `case 'item':` block to the `renderCrumb` switch, after the `case 'foe':` block:

```ts
case 'item':
  listItem = (
    <li key={`${index}-${item.kind}`}>
      <ItemCrumb />
    </li>
  );
  break;
```

## DB Layer — Seed

### `app/db/table-config/seed.ts` changes

Add `Item` type import alongside existing type imports:

```ts
import type { Item } from '@db/item';
```

Add `itemsConfig` constant after `foesConfig`:

```ts
const itemsConfig: TypedCreateTableConfigInput<Item> = {
  table_name: 'items',
  color: '#9b59b6',
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

Add `itemsConfig` to the `defaultConfigs` array, after `foesConfig`:

```ts
const defaultConfigs: CreateTableConfigInput[] = [
  adventuresConfig,
  npcsConfig,
  foesConfig,
  itemsConfig,
  sessionsConfig,
];
```
