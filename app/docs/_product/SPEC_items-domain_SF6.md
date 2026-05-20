# SF6: Routes + Barrel Registrations

Create TanStack Router route files and register screens and DAL hooks in their grouping
barrels. Depends on SF4 (DAL hooks) and SF5 (screens). Must complete before SF7
(breadcrumbs import `useItem` from `@/data-access-layer`).

**Commit together with SF5** — SF5 has unresolved `@/data-access-layer` imports until
this SF's barrel updates land.

## Files Affected

```
New:
  app/src/routes/adventure.$adventureId.items.tsx
  app/src/routes/adventure.$adventureId.item.$itemId.tsx

Modified:
  app/src/screens/index.ts — add ItemsScreen and ItemScreen exports
  app/src/data-access-layer/index.ts — add useItems, useItem, itemKeys exports
  app/src/components/SideBarNav/SideBarNav.tsx — add Items ScreenNavBtn to adventure-scoped group
```

## Frontend Layer — Routes

### `app/src/routes/adventure.$adventureId.items.tsx`

```ts
import { createFileRoute } from '@tanstack/react-router';
import { ItemsScreen } from '@/screens';

export const Route = createFileRoute('/adventure/$adventureId/items')({
  component: ItemsScreen,
});
```

### `app/src/routes/adventure.$adventureId.item.$itemId.tsx`

```ts
import { createFileRoute } from '@tanstack/react-router';
import { ItemScreen } from '@/screens';

export const Route = createFileRoute('/adventure/$adventureId/item/$itemId')({
  component: ItemScreen,
});
```

After creating these files, manually add the two new route entries to
`src/routeTree.gen.ts` so that `tsc --noEmit` passes. This edit is ephemeral —
`routeTree.gen.ts` is gitignored and regenerates on dev server start. The manual
edit does not need to be committed.

## Frontend Layer — Sidebar Navigation

### `app/src/components/SideBarNav/SideBarNav.tsx` changes

Add a `ScreenNavBtn` for Items inside the `<div className='sidebar-nav-btn-group'>` block,
after the Foes entry:

```tsx
<ScreenNavBtn
  label='Items'
  to='/adventure/$adventureId/items'
  params={{ adventureId: adventureId ?? '' }}
  isDisabled={!adventureId}
  configColor={getTableColor('items')}
/>
```

Verify the entry is absent before adding — do not duplicate if already present.

## Barrel Registrations

### `app/src/screens/index.ts` changes

Add after the existing FoeScreen export:

```ts
export { ItemsScreen } from './items/ItemsScreen';
export { ItemScreen } from './item/ItemScreen';
```

### `app/src/data-access-layer/index.ts` changes

Add after the existing `useFoes, useFoe, foeKeys` export:

```ts
export { useItems, useItem, itemKeys } from './items';
```
