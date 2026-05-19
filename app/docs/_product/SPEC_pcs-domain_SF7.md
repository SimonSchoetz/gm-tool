# SF7: Breadcrumbs + Seed

Wire the Pc domain into the breadcrumb system and seed the table config. Depends on
SF6 (`usePc` available via `@/data-access-layer`). All breadcrumb changes are
applied atomically in this SF — do not run baseline checks after individual file edits
within this SF, only after all files in this SF are complete.

## Files Affected

```
New:
  app/src/components/Header/components/BreadcrumbList/components/PcCrumb.tsx

Modified:
  app/src/components/Header/components/BreadcrumbList/components/index.ts
    — add PcCrumb export
  app/src/components/Header/helper/buildBreadcrumbs.ts
    — extend BreadcrumbConfig union; add pcs and pc route cases
  app/src/components/Header/helper/__tests__/buildBreadcrumbs.test.ts
    — add assertions for both new route IDs (observable behavior change)
  app/src/components/Header/components/BreadcrumbList/BreadcrumbList.tsx
    — add PcCrumb import; add 'pc' case to renderCrumb switch
  app/db/table-config/seed.ts
    — add Pc type import, pcsConfig constant, pcsConfig to defaultConfigs
```

## Frontend Layer — Breadcrumbs

### `app/src/components/Header/components/BreadcrumbList/components/PcCrumb.tsx`

**Purpose**: Renders the breadcrumb link for a PC detail page, displaying the PC's
name fetched from the cache.

**Behavior**: Reads `adventureId` and `pcId` from `useParams({ strict: false })`.
Calls `usePc(pcId ?? '', adventureId ?? '')`. Displays `pc?.name ?? '…'`.

```tsx
import { Link, useParams } from '@tanstack/react-router';
import { usePc } from '@/data-access-layer';

export const PcCrumb = () => {
  const { adventureId, pcId } = useParams({ strict: false });
  const { pc } = usePc(pcId ?? '', adventureId ?? '');

  return (
    <Link
      to='/adventure/$adventureId/pc/$pcId'
      params={{ adventureId: adventureId ?? '', pcId: pcId ?? '' }}
    >
      {pc?.name ?? '…'}
    </Link>
  );
};
```

### `app/src/components/Header/components/BreadcrumbList/components/index.ts` changes

Add after the existing `FoeCrumb` export:

```ts
export { PcCrumb } from './PcCrumb';
```

### `app/src/components/Header/helper/buildBreadcrumbs.ts` changes

**Extend `BreadcrumbConfig` union** — add `| { kind: 'pc' }` after `| { kind: 'foe' }`:

```ts
export type BreadcrumbConfig =
  | { kind: 'static'; label: string; to: string; params: Record<string, string> }
  | { kind: 'adventure' }
  | { kind: 'session' }
  | { kind: 'npc' }
  | { kind: 'foe' }
  | { kind: 'pc' };
```

**Add two cases** to the `buildBreadcrumbs` switch, after the Foe cases:

```ts
case '/adventure/$adventureId/pcs':
  return [
    {
      kind: 'static',
      label: 'PCs',
      to: '/adventure/$adventureId/pcs',
      params: { adventureId: p.adventureId },
    },
  ];
case '/adventure/$adventureId/pc/$pcId':
  return [
    {
      kind: 'static',
      label: 'PCs',
      to: '/adventure/$adventureId/pcs',
      params: { adventureId: p.adventureId },
    },
    { kind: 'pc' },
  ];
```

### `app/src/components/Header/helper/__tests__/buildBreadcrumbs.test.ts` changes

Add test cases covering the two new route IDs. Required assertions:

- `routeId: '/adventure/$adventureId/pcs'` with `params: { adventureId: 'adv-1' }`
  produces `[{ kind: 'static', label: 'PCs', to: '/adventure/$adventureId/pcs', params: { adventureId: 'adv-1' } }]`
- `routeId: '/adventure/$adventureId/pc/$pcId'` with
  `params: { adventureId: 'adv-1', pcId: 'pc-1' }` produces
  `[{ kind: 'static', label: 'PCs', to: '/adventure/$adventureId/pcs', params: { adventureId: 'adv-1' } }, { kind: 'pc' }]`

Follow the existing test structure in the file for mock setup and assertion style.

### `app/src/components/Header/components/BreadcrumbList/BreadcrumbList.tsx` changes

Add `PcCrumb` to the named import from `'./components'`:

```ts
import { AdventureCrumb, SessionCrumb, NpcCrumb, FoeCrumb, PcCrumb } from './components';
```

Add a `case 'pc':` block to the `renderCrumb` switch, after the `case 'foe':` block:

```ts
case 'pc':
  listItem = (
    <li key={`${index}-${item.kind}`}>
      <PcCrumb />
    </li>
  );
  break;
```

## DB Layer — Seed

### `app/db/table-config/seed.ts` changes

Add `Pc` type import alongside existing type imports:

```ts
import type { Pc } from '@db/pc';
```

Add `pcsConfig` constant after `foesConfig`:

```ts
const pcsConfig: TypedCreateTableConfigInput<Pc> = {
  table_name: 'pcs',
  color: '#1abc9c',
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

Add `pcsConfig` to the `defaultConfigs` array, after `foesConfig`:

```ts
const defaultConfigs: CreateTableConfigInput[] = [
  adventuresConfig,
  npcsConfig,
  foesConfig,
  pcsConfig,
  sessionsConfig,
];
```
