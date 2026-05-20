# SF4: DAL

Create the `data-access-layer/items/` module. Depends on SF1 (`@db/item`) and SF3
(`@services/itemsService`). Consumed by SF5 (screens).

## Files Affected

```
New:
  app/src/data-access-layer/items/itemKeys.ts
  app/src/data-access-layer/items/useItems.ts
  app/src/data-access-layer/items/useItem.ts
  app/src/data-access-layer/items/index.ts
```

`data-access-layer/index.ts` is updated in SF6 once screens confirm the public API.

## Data Access Layer

### `app/src/data-access-layer/items/itemKeys.ts`

```ts
export const itemKeys = {
  list: (adventureId: string) => ['items', adventureId] as const,
  detail: (itemId: string) => ['item', itemId] as const,
};
```

### `app/src/data-access-layer/items/useItems.ts` and `useItem.ts`

Follow `data-access-layer/npcs/useNpcs.ts` and `useNpc.ts` exactly, substituting
`item`/`Item`/`items`/`Items`/`itemKeys`/`itemsService` for
`npc`/`Npc`/`npcs`/`Npcs`/`npcKeys`/`npcsService`.

Before using the NPC hooks as a reference, verify that `deleteNpc` and `removeNpcImage`
on `useNpc`'s return type are declared as named wrapper functions — not direct
`mutateAsync` assignments. Fix before copying if not already correct.

### `app/src/data-access-layer/items/index.ts`

```ts
export { useItems } from './useItems';
export { useItem } from './useItem';
export { itemKeys } from './itemKeys';
```
