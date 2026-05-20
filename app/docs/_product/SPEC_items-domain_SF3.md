# SF3: Service Layer

Create `services/itemsService.ts`. Depends on SF1 (`@db/item`) and SF2
(`@domain/items`).

## Files Affected

```
New:
  app/services/itemsService.ts
```

## Services Layer

Follow `services/npcsService.ts` exactly, substituting `Item`/`items`/`item` for
`Npc`/`npcs`/`npc` and `@db/item`/`@domain/items` for `@db/npc`/`@domain/npcs`.

Before using `npcsService.ts` as a reference, verify that `deleteNpc` and `removeNpcImage`
are declared as named wrapper functions — not `mutation.mutateAsync` assigned directly.
Fix before copying if not already correct.

Domain-specific identifiers after substitution:

| Source (NPC) | Target (Item) |
|---|---|
| `getAllNpcs` | `getAllItems` |
| `getNpcById` | `getItemById` |
| `createNpc` | `createItem` |
| `updateNpc` | `updateItem` |
| `removeNpcImage` | `removeItemImage` |
| `deleteNpc` | `deleteItem` |
| `UpdateNpcData` | `UpdateItemData` |
| `npcNotFoundError` | `itemNotFoundError` |
| `npcLoadError` | `itemLoadError` |
| `npcCreateError` | `itemCreateError` |
| `npcUpdateError` | `itemUpdateError` |
| `npcDeleteError` | `itemDeleteError` |
