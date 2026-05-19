# SF3: Service Layer

Create `services/pcsService.ts`. Depends on SF1 (`@db/pc`) and SF2 (`@domain/pcs`).

## Files Affected

```
New:
  app/services/pcsService.ts
```

## Services Layer

Follow `services/npcsService.ts` exactly, substituting `Pc`/`pcs`/`pc` for `Npc`/`npcs`/`npc`
and `@db/pc`/`@domain/pcs` for `@db/npc`/`@domain/npcs`.

Before using `npcsService.ts` as a reference, verify that `deleteNpc` and `removeNpcImage`
are declared as named wrapper functions (not `mutation.mutateAsync` assigned directly).
If they are not, fix the reference before copying.

Domain-specific identifiers after substitution:

| Source (NPC) | Target (PC) |
|---|---|
| `getAllNpcs` | `getAllPcs` |
| `getNpcById` | `getPcById` |
| `createNpc` | `createPc` |
| `updateNpc` | `updatePc` |
| `removeNpcImage` | `removePcImage` |
| `deleteNpc` | `deletePc` |
| `UpdateNpcData` | `UpdatePcData` |
| `NpcNotFoundError` / `npcNotFoundError` | `PcNotFoundError` / `pcNotFoundError` |
| `npcLoadError`, `npcCreateError`, `npcUpdateError`, `npcDeleteError` | `pcLoadError`, `pcCreateError`, `pcUpdateError`, `pcDeleteError` |
