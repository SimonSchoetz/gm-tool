# SF4: DAL

Create the `data-access-layer/factions/` module. Depends on SF1 (`@db/faction`) and SF3
(`@services/factionsService`). Consumed by SF5 (screens).

## Files Affected

```
New:
  app/src/data-access-layer/factions/factionKeys.ts
  app/src/data-access-layer/factions/useFactions.ts
  app/src/data-access-layer/factions/useFaction.ts
  app/src/data-access-layer/factions/index.ts
```

`data-access-layer/index.ts` is updated in SF6 once screens confirm the public API.

## Data Access Layer

### `app/src/data-access-layer/factions/factionKeys.ts`

```ts
export const factionKeys = {
  list: (adventureId: string) => ['factions', adventureId] as const,
  detail: (factionId: string) => ['faction', factionId] as const,
};
```

### `app/src/data-access-layer/factions/useFactions.ts` and `useFaction.ts`

Follow `data-access-layer/npcs/useNpcs.ts` and `useNpc.ts` exactly, substituting
`faction`/`Faction`/`factions`/`Factions`/`factionKeys`/`factionsService` for
`npc`/`Npc`/`npcs`/`Npcs`/`npcKeys`/`npcsService`.

Before using the NPC hooks as a reference, verify that `deleteNpc` and `removeNpcImage`
on `useNpc`'s return type are declared as named wrapper functions — not direct
`mutateAsync` assignments. Fix before copying if not already correct.

### `app/src/data-access-layer/factions/index.ts`

```ts
export { useFactions } from './useFactions';
export { useFaction } from './useFaction';
export { factionKeys } from './factionKeys';
```
