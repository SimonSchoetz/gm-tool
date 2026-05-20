# SF6: Routes + Barrel Registrations

Create TanStack Router route files and register screens and DAL hooks in their grouping
barrels. Depends on SF4 (DAL hooks) and SF5 (screens). Must complete before SF7
(breadcrumbs import `useFaction` from `@/data-access-layer`).

**Commit together with SF5** — SF5 has unresolved `@/data-access-layer` imports until
this SF's barrel updates land.

## Files Affected

```
New:
  app/src/routes/adventure.$adventureId.factions.tsx
  app/src/routes/adventure.$adventureId.faction.$factionId.tsx

Modified:
  app/src/screens/index.ts — add FactionsScreen and FactionScreen exports
  app/src/data-access-layer/index.ts — add useFactions, useFaction, factionKeys exports
  app/src/components/SideBarNav/SideBarNav.tsx — add Factions ScreenNavBtn to adventure-scoped group
```

## Frontend Layer — Routes

### `app/src/routes/adventure.$adventureId.factions.tsx`

```ts
import { createFileRoute } from '@tanstack/react-router';
import { FactionsScreen } from '@/screens';

export const Route = createFileRoute('/adventure/$adventureId/factions')({
  component: FactionsScreen,
});
```

### `app/src/routes/adventure.$adventureId.faction.$factionId.tsx`

```ts
import { createFileRoute } from '@tanstack/react-router';
import { FactionScreen } from '@/screens';

export const Route = createFileRoute('/adventure/$adventureId/faction/$factionId')({
  component: FactionScreen,
});
```

After creating these files, manually add the two new route entries to
`src/routeTree.gen.ts` so that `tsc --noEmit` passes. This edit is ephemeral —
`routeTree.gen.ts` is gitignored and regenerates on dev server start. The manual
edit does not need to be committed.

## Frontend Layer — Sidebar Navigation

### `app/src/components/SideBarNav/SideBarNav.tsx` changes

Add a `ScreenNavBtn` for Factions inside the `<div className='sidebar-nav-btn-group'>` block,
after the Foes entry:

```tsx
<ScreenNavBtn
  label='Factions'
  to='/adventure/$adventureId/factions'
  params={{ adventureId: adventureId ?? '' }}
  isDisabled={!adventureId}
  configColor={getTableColor('factions')}
/>
```

Verify the entry is absent before adding — do not duplicate if already present.

## Barrel Registrations

### `app/src/screens/index.ts` changes

Add after the existing FoeScreen export:

```ts
export { FactionsScreen } from './factions/FactionsScreen';
export { FactionScreen } from './faction/FactionScreen';
```

### `app/src/data-access-layer/index.ts` changes

Add after the existing `useFoes, useFoe, foeKeys` export:

```ts
export { useFactions, useFaction, factionKeys } from './factions';
```
