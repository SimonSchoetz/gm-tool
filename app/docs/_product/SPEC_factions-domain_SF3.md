# SF3: Service Layer

Create `services/factionsService.ts`. Depends on SF1 (`@db/faction`) and SF2
(`@domain/factions`).

## Files Affected

```
New:
  app/services/factionsService.ts
```

## Services Layer

Follow `services/npcsService.ts` exactly, substituting `Faction`/`factions`/`faction` for
`Npc`/`npcs`/`npc` and `@db/faction`/`@domain/factions` for `@db/npc`/`@domain/npcs`.

Before using `npcsService.ts` as a reference, verify that `deleteNpc` and `removeNpcImage`
are declared as named wrapper functions — not `mutation.mutateAsync` assigned directly.
Fix before copying if not already correct.

Domain-specific identifiers after substitution:

| Source (NPC) | Target (Faction) |
|---|---|
| `getAllNpcs` | `getAllFactions` |
| `getNpcById` | `getFactionById` |
| `createNpc` | `createFaction` |
| `updateNpc` | `updateFaction` |
| `removeNpcImage` | `removeFactionImage` |
| `deleteNpc` | `deleteFaction` |
| `UpdateNpcData` | `UpdateFactionData` |
| `npcNotFoundError` | `factionNotFoundError` |
| `npcLoadError` | `factionLoadError` |
| `npcCreateError` | `factionCreateError` |
| `npcUpdateError` | `factionUpdateError` |
| `npcDeleteError` | `factionDeleteError` |
