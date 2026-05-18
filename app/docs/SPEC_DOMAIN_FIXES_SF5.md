# SF5 — Remove Comment from `npcKeys.ts`

Remove the explanatory comment that describes what `npcKeys` is rather than why it exists.

## Files Affected

Modified:
- `app/src/data-access-layer/npcs/npcKeys.ts`

## DAL Changes

### `app/src/data-access-layer/npcs/npcKeys.ts`

Delete line 1:

```ts
// Query key factory — single source of truth for all NPC cache keys
```

The file after the change:

```ts
export const npcKeys = {
  list: (adventureId: string) => ['npcs', adventureId] as const,
  detail: (npcId: string) => ['npc', npcId] as const,
};
```

## DB, Services, Frontend

No changes.
