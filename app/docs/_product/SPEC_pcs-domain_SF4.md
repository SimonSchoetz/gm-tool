# SF4: DAL

Create the `data-access-layer/pcs/` module. Depends on SF1 (`@db/pc`) and SF3
(`@services/pcsService`). Consumed by SF5 (screens).

## Files Affected

```
New:
  app/src/data-access-layer/pcs/pcKeys.ts
  app/src/data-access-layer/pcs/usePcs.ts
  app/src/data-access-layer/pcs/usePc.ts
  app/src/data-access-layer/pcs/index.ts
```

`data-access-layer/index.ts` is updated in SF6 once screens confirm the public API.

## Data Access Layer

### `app/src/data-access-layer/pcs/pcKeys.ts`

```ts
export const pcKeys = {
  list: (adventureId: string) => ['pcs', adventureId] as const,
  detail: (pcId: string) => ['pc', pcId] as const,
};
```

### `app/src/data-access-layer/pcs/usePcs.ts` and `usePc.ts`

Follow `data-access-layer/npcs/useNpcs.ts` and `useNpc.ts` exactly, substituting
`pc`/`Pc`/`pcs`/`Pcs`/`pcKeys`/`pcsService` for `npc`/`Npc`/`npcs`/`Npcs`/`npcKeys`/`npcsService`.

Before using the NPC hooks as a reference, verify that `deleteNpc` and `removeNpcImage`
on `useNpc`'s return type are declared as named wrapper functions — not direct
`mutateAsync` assignments. Fix before copying if not already correct.

### `app/src/data-access-layer/pcs/index.ts`

```ts
export { usePcs } from './usePcs';
export { usePc } from './usePc';
export { pcKeys } from './pcKeys';
```
