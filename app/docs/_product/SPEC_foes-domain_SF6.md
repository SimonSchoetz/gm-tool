# SF6: Routes + Barrel Registrations

Create TanStack Router route files and register screens and DAL hooks in their
grouping barrels. Depends on SF4 (DAL hooks) and SF5 (screens). Must complete before
SF7 (breadcrumbs import `useFoe` from `@/data-access-layer`).

## Files Affected

```
New:
  app/src/routes/adventure.$adventureId.foes.tsx
  app/src/routes/adventure.$adventureId.foe.$foeId.tsx

Modified:
  app/src/screens/index.ts — add FoesScreen and FoeScreen exports
  app/src/data-access-layer/index.ts — add useFoes, useFoe, foeKeys exports
  app/src/components/SideBarNav/SideBarNav.tsx — add Foes ScreenNavBtn to adventure-scoped group
```

## Frontend Layer — Routes

### `app/src/routes/adventure.$adventureId.foes.tsx`

```ts
import { createFileRoute } from '@tanstack/react-router';
import { FoesScreen } from '@/screens';

export const Route = createFileRoute('/adventure/$adventureId/foes')({
  component: FoesScreen,
});
```

### `app/src/routes/adventure.$adventureId.foe.$foeId.tsx`

```ts
import { createFileRoute } from '@tanstack/react-router';
import { FoeScreen } from '@/screens';

export const Route = createFileRoute('/adventure/$adventureId/foe/$foeId')({
  component: FoeScreen,
});
```

TanStack Router regenerates `src/routeTree.gen.ts` automatically on the next dev server
start after these files are created. No manual edit to `routeTree.gen.ts` is required.

## Frontend Layer — Sidebar Navigation

### `app/src/components/SideBarNav/SideBarNav.tsx` changes

Add a `ScreenNavBtn` for Foes inside the `<div className='sidebar-nav-btn-group'>` block,
after the NPCs entry:

```tsx
<ScreenNavBtnW
  label='Foes'
  to='/adventure/$adventureId/foes'
  params={{ adventureId: adventureId ?? '' }}
  isDisabled={!adventureId}
  configColor={getTableColor('sessions')}
/>
```

Note: this entry may already be present if added manually before spec implementation.
Verify before applying — add only if absent.

## Barrel Registrations

### `app/src/screens/index.ts` changes

Add after the existing NpcScreen export:

```ts
export { FoesScreen } from './foes/FoesScreen';
export { FoeScreen } from './foe/FoeScreen';
```

### `app/src/data-access-layer/index.ts` changes

Add after the existing `useNpcs, useNpc, npcKeys` export:

```ts
export { useFoes, useFoe, foeKeys } from './foes';
```
