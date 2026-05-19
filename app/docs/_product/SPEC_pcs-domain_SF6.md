# SF6: Routes + Barrel Registrations

Create TanStack Router route files and register screens and DAL hooks in their
grouping barrels. Depends on SF4 (DAL hooks) and SF5 (screens). Must complete before
SF7 (breadcrumbs import `usePc` from `@/data-access-layer`).

**Commit together with SF5** — SF5 has unresolved `@/data-access-layer` imports
until this SF's barrel updates land.

## Files Affected

```
New:
  app/src/routes/adventure.$adventureId.pcs.tsx
  app/src/routes/adventure.$adventureId.pc.$pcId.tsx

Modified:
  app/src/screens/index.ts — add PcsScreen and PcScreen exports
  app/src/data-access-layer/index.ts — add usePcs, usePc, pcKeys exports
  app/src/components/SideBarNav/SideBarNav.tsx — add PCs ScreenNavBtn to adventure-scoped group
```

## Frontend Layer — Routes

### `app/src/routes/adventure.$adventureId.pcs.tsx`

```ts
import { createFileRoute } from '@tanstack/react-router';
import { PcsScreen } from '@/screens';

export const Route = createFileRoute('/adventure/$adventureId/pcs')({
  component: PcsScreen,
});
```

### `app/src/routes/adventure.$adventureId.pc.$pcId.tsx`

```ts
import { createFileRoute } from '@tanstack/react-router';
import { PcScreen } from '@/screens';

export const Route = createFileRoute('/adventure/$adventureId/pc/$pcId')({
  component: PcScreen,
});
```

After creating these files, manually add the two new route entries to
`src/routeTree.gen.ts` so that `tsc --noEmit` passes. This edit is ephemeral —
`routeTree.gen.ts` is gitignored and regenerates on dev server start. The manual
edit does not need to be committed.

## Frontend Layer — Sidebar Navigation

### `app/src/components/SideBarNav/SideBarNav.tsx` changes

Add a `ScreenNavBtn` for PCs inside the `<div className='sidebar-nav-btn-group'>` block,
after the Foes entry:

```tsx
<ScreenNavBtn
  label='PCs'
  to='/adventure/$adventureId/pcs'
  params={{ adventureId: adventureId ?? '' }}
  isDisabled={!adventureId}
  configColor={getTableColor('pcs')}
/>
```

Verify the entry is absent before adding — do not duplicate if already present.

## Barrel Registrations

### `app/src/screens/index.ts` changes

Add after the existing FoeScreen export:

```ts
export { PcsScreen } from './pcs/PcsScreen';
export { PcScreen } from './pc/PcScreen';
```

### `app/src/data-access-layer/index.ts` changes

Add after the existing `useFoes, useFoe, foeKeys` export:

```ts
export { usePcs, usePc, pcKeys } from './pcs';
```
