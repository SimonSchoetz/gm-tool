# SF4 — Base entity service

One service replacing the six per-type entity services. Additive: the six old service files stay until SF7.

## Files affected

Modified: none

New:

- `app/services/baseEntityService.ts`

Moved: none

Draft: none

## Services

Reference: `app/services/npcsService.ts`, validated against `app/services/CLAUDE.md`: every exported function wraps its db call in try/catch and throws a typed domain error; image lifecycle is owned here; `removeNpcImage` fetches and early-returns before its `try`. Deviations from the reference are listed in the table. The file name is singular (KAD: Service file is singular).

Imports: `import * as baseEntityDb from '@db/base-entity';`, `import * as imageService from '@services/imageService';`, `import type { BaseEntity, UpdateBaseEntityInput } from '@db/base-entity';`, `import type { BaseEntityType } from '@domain/entities';`, and the six factories from `'@domain/base-entities'`.

`export type UpdateBaseEntityData = UpdateBaseEntityInput & { imgFilePath?: string };`

Every function takes `entityType: BaseEntityType` first (KAD: Entity type is the first argument at every layer) and passes it to each error factory.

| Reference (`npcsService.ts`) | `baseEntityService.ts` |
| --- | --- |
| `getAllNpcs(adventureId)` → `npcDb.getAll(adventureId)`; `npcLoadError(err)` | `getAllBaseEntities(entityType, adventureId): Promise<BaseEntity[]>` → `baseEntityDb.getAll(entityType, adventureId)`; `baseEntityLoadError(entityType, err)` |
| `getNpcById(id)` → `npcDb.get(id)`; `npcLoadError(err)`; `npcNotFoundError(id)` on null | `getBaseEntityById(entityType, id): Promise<BaseEntity>` → `baseEntityDb.get(entityType, id)`; `baseEntityLoadError(entityType, err)`; `baseEntityNotFoundError(entityType, id)` on null |
| `createNpc(adventureId)` → `npcDb.create(adventureId)`; `npcCreateError(err)` | `createBaseEntity(entityType, adventureId): Promise<string>` → `baseEntityDb.create(entityType, adventureId)`; `baseEntityCreateError(entityType, err)` |
| `updateNpc(id, data)` → `npcDb.update(id, dto)`; `npcUpdateError(id, err)` | `updateBaseEntity(entityType, id, data: UpdateBaseEntityData): Promise<void>` → `baseEntityDb.update(id, dto)`; `baseEntityUpdateError(entityType, id, err)`; image replace/create logic unchanged |
| `removeNpcImage(npcId)` → `getNpcById(npcId)` outside `try`, early return when `image_id` is null | `removeBaseEntityImage(entityType, id): Promise<void>` → `getBaseEntityById(entityType, id)` outside `try`, same early return; inside `try`: `imageService.deleteImage`, then `baseEntityDb.update(id, { image_id: null })`; `baseEntityUpdateError(entityType, id, err)` |
| `deleteNpc(id, npc = null)` → `npc ?? (await getNpcById(id))` | `deleteBaseEntity(entityType, id): Promise<void>` — no second parameter (KAD: Error factories take the entity type…); inside `try`: `getBaseEntityById(entityType, id)`, delete its image when `image_id` is set, then `baseEntityDb.remove(id)`; `baseEntityDeleteError(entityType, id, err)` |
| `duplicateNpc(id)` → `getNpcById(id)`, `imageService.duplicateImage`, `npcDb.duplicate(id, imageId)` | `duplicateBaseEntity(entityType, id): Promise<string>` → `getBaseEntityById(entityType, id)`, `imageService.duplicateImage` when `image_id` is set, `baseEntityDb.duplicate(entityType, id, imageId)`; `baseEntityDuplicateError(entityType, id, err)` |

`app/services/` has no `__tests__/` convention; no test file is added.

### Cross-SF consumers

- every exported function and `UpdateBaseEntityData` — SF5 `app/src/data-access-layer/base-entities/baseEntityQueryOptions.ts`, `useBaseEntities.ts`, `useBaseEntity.ts` (`import * as service from '@services/baseEntityService'`; `import type { UpdateBaseEntityData } from '@services/baseEntityService'`)
