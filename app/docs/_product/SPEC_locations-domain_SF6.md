# SF6: Routes + Barrel Registrations

Create TanStack Router route files and register screens and DAL hooks in their grouping
barrels. Depends on SF4 (DAL hooks) and SF5 (screens). Must complete before SF7
(breadcrumbs import `useLocation` from `@/data-access-layer`).

**Commit together with SF5** — SF5 has unresolved `@/data-access-layer` imports until
this SF's barrel updates land.

## Files Affected

```
New:
  app/src/routes/adventure.$adventureId.locations.tsx
  app/src/routes/adventure.$adventureId.location.$locationId.tsx

Modified:
  app/src/screens/index.ts — add LocationsScreen and LocationScreen exports
  app/src/data-access-layer/index.ts — add useLocations, useLocation, locationKeys exports
  app/src/components/SideBarNav/SideBarNav.tsx — add Locations ScreenNavBtn to adventure-scoped group
```

## Frontend Layer — Routes

### `app/src/routes/adventure.$adventureId.locations.tsx`

```ts
import { createFileRoute } from '@tanstack/react-router';
import { LocationsScreen } from '@/screens';

export const Route = createFileRoute('/adventure/$adventureId/locations')({
  component: LocationsScreen,
});
```

### `app/src/routes/adventure.$adventureId.location.$locationId.tsx`

```ts
import { createFileRoute } from '@tanstack/react-router';
import { LocationScreen } from '@/screens';

export const Route = createFileRoute('/adventure/$adventureId/location/$locationId')({
  component: LocationScreen,
});
```

After creating these files, manually add the two new route entries to
`src/routeTree.gen.ts` so that `tsc --noEmit` passes. This edit is ephemeral —
`routeTree.gen.ts` is gitignored and regenerates on dev server start. The manual
edit does not need to be committed.

## Frontend Layer — Sidebar Navigation

### `app/src/components/SideBarNav/SideBarNav.tsx` changes

Add a `ScreenNavBtn` for Locations inside the `<div className='sidebar-nav-btn-group'>` block,
after the Foes entry:

```tsx
<ScreenNavBtn
  label='Locations'
  to='/adventure/$adventureId/locations'
  params={{ adventureId: adventureId ?? '' }}
  isDisabled={!adventureId}
  configColor={getTableColor('locations')}
/>
```

Verify the entry is absent before adding — do not duplicate if already present.

## Barrel Registrations

### `app/src/screens/index.ts` changes

Add after the existing FoeScreen export:

```ts
export { LocationsScreen } from './locations/LocationsScreen';
export { LocationScreen } from './location/LocationScreen';
```

### `app/src/data-access-layer/index.ts` changes

Add after the existing `useFoes, useFoe, foeKeys` export:

```ts
export { useLocations, useLocation, locationKeys } from './locations';
```
