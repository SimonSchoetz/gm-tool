# SF5 — Base entity data access

Shared query keys, query options, and hooks for all six base entity types, and the mention prefetch rewired onto them. The six per-type DAL modules and their grouping-barrel exports stay until SF7.

## Files affected

Modified:

- `app/src/data-access-layer/index.ts` — add the shared hooks and query-options exports
- `app/src/data-access-layer/mentions/mentionPrefetchByType.ts` — six per-type entries built by one factory on the shared query options

New:

- `app/src/data-access-layer/base-entities/baseEntityKeys.ts`
- `app/src/data-access-layer/base-entities/baseEntityQueryOptions.ts`
- `app/src/data-access-layer/base-entities/useBaseEntities.ts`
- `app/src/data-access-layer/base-entities/useBaseEntity.ts`
- `app/src/data-access-layer/base-entities/index.ts`

Moved: none

Draft: none

## Data Access Layer

Conventions: `.claude/rules/src-data-access-layer.md`. Import `type BaseEntityType` from `'@domain/entities'` in every new file that needs it.

### `baseEntityKeys.ts`

```ts
export const baseEntityKeys = {
  list: (entityType: BaseEntityType, adventureId: string) =>
    [entityType, adventureId] as const,
  detail: (entityType: BaseEntityType, baseEntityId: string) =>
    ['base-entity', entityType, baseEntityId] as const,
};
```

Add a single-line comment above `list` stating that the key must start with the bare entity type because `useSetPinnedOrder` invalidates `[table_config.table_name]` as a prefix (KAD: The base-entity list query key keeps `[entityType, adventureId]`) — a future edit prefixing this key would silently stop pin/unpin from refreshing lists.

### `baseEntityQueryOptions.ts`

Reference: `app/src/data-access-layer/npcs/npcQueryOptions.ts` (validated: `queryOptions()`-built, `throwOnError: true`). Substitutions:

| Reference | Shared |
| --- | --- |
| `import * as service from '@services/npcsService'` | `import * as service from '@services/baseEntityService'` |
| `npcKeys` | `baseEntityKeys` |
| `npcListQueryOptions(adventureId)` | `baseEntityListQueryOptions(entityType: BaseEntityType, adventureId: string)` |
| `npcKeys.list(adventureId)` / `service.getAllNpcs(adventureId)` | `baseEntityKeys.list(entityType, adventureId)` / `service.getAllBaseEntities(entityType, adventureId)` |
| `npcQueryOptions(npcId)` | `baseEntityQueryOptions(entityType: BaseEntityType, baseEntityId: string)` |
| `npcKeys.detail(npcId)` / `service.getNpcById(npcId)` | `baseEntityKeys.detail(entityType, baseEntityId)` / `service.getBaseEntityById(entityType, baseEntityId)` |
| `enabled: !!npcId` | `enabled: !!baseEntityId` |

All other options (`enabled: !!adventureId`, `staleTime: 0`, `refetchOnMount: 'always'`, `throwOnError: true`) are unchanged.

### `useBaseEntities.ts`

Reference: `app/src/data-access-layer/npcs/useNpcs.ts` (validated: named wrapper for `createNpc`, list-key invalidation). Signature `useBaseEntities(entityType: BaseEntityType, adventureId: string): UseBaseEntitiesReturn`, where `type UseBaseEntitiesReturn = { baseEntities: BaseEntity[]; loading: boolean; createBaseEntity: () => Promise<string> }`. Substitutions: `Npc` → `BaseEntity` (from `'@db/base-entity'`), `service.createNpc(adventureId)` → `service.createBaseEntity(entityType, adventureId)`, `npcListQueryOptions(adventureId)` → `baseEntityListQueryOptions(entityType, adventureId)`, `npcKeys.list(adventureId)` → `baseEntityKeys.list(entityType, adventureId)`, local names `npcs` / `isLoadingNpcs` / `createNpc` → `baseEntities` / `isLoadingBaseEntities` / `createBaseEntity`. `entityType` is captured in the mutation's closure like `adventureId` (synchronous dispatch).

### `useBaseEntity.ts`

Reference: `app/src/data-access-layer/npcs/useNpc.ts` (validated: deferred-dispatch carve-out with its comment, named wrappers, list-only invalidation for duplicate through `useDuplicateMutation`). Signature `useBaseEntity(entityType: BaseEntityType, baseEntityId: string, adventureId: string): UseBaseEntityReturn`, where:

```ts
type UseBaseEntityReturn = {
  baseEntity: BaseEntity | null;
  loading: boolean;
  updateBaseEntity: (data: UpdateBaseEntityData) => void;
  deleteBaseEntity: () => Promise<void>;
  duplicateBaseEntity: () => Promise<string>;
  removeBaseEntityImage: () => Promise<void>;
};
```

Substitutions:

| Reference | Shared |
| --- | --- |
| `Npc`, `UpdateNpcData` | `BaseEntity` (`'@db/base-entity'`), `UpdateBaseEntityData` (`'@services/baseEntityService'`) |
| `npcQueryOptions(npcId)` | `baseEntityQueryOptions(entityType, baseEntityId)` |
| update `mutationFn: ({ id, data }: { id: string; data: UpdateNpcData }) => service.updateNpc(id, data)` | `mutationFn: ({ entityType: scheduledType, id, data }: { entityType: BaseEntityType; id: string; data: UpdateBaseEntityData }) => service.updateBaseEntity(scheduledType, id, data)` |
| update `onSuccess: (_result, { id })` invalidating `npcKeys.detail(id)` and `npcKeys.list(adventureId)` | `onSuccess: (_result, { entityType: scheduledType, id })` invalidating `baseEntityKeys.detail(scheduledType, id)` and `baseEntityKeys.list(scheduledType, adventureId)` |
| `npcKeys.detail(npcId)` (remove-image `onSuccess`) | `baseEntityKeys.detail(entityType, baseEntityId)` |
| `npcKeys.list(adventureId)` (delete, duplicate, remove-image) | `baseEntityKeys.list(entityType, adventureId)` |
| `service.deleteNpc(npcId)` | `service.deleteBaseEntity(entityType, baseEntityId)` |
| `service.duplicateNpc(npcId)` | `service.duplicateBaseEntity(entityType, baseEntityId)` |
| `service.removeNpcImage(npcId)` | `service.removeBaseEntityImage(entityType, baseEntityId)` |
| `setQueryData<Npc>(npcKeys.detail(npcId), …)` | `setQueryData<BaseEntity>(baseEntityKeys.detail(entityType, baseEntityId), …)` |
| `updateMutation.mutate({ id: npcId, data: updates })` | `updateMutation.mutate({ entityType, id: baseEntityId, data: updates })` |
| local names `npcData`, `isLoadingNpc`, `updateNpc`, `deleteNpc`, `duplicateNpc`, `removeNpcImage`, `removeNpcImageMutation` | `baseEntityData`, `isLoadingBaseEntity`, `updateBaseEntity`, `deleteBaseEntity`, `duplicateBaseEntity`, `removeBaseEntityImage`, `removeBaseEntityImageMutation` |
| return `npc: npcData ?? null` | `baseEntity: baseEntityData ?? null` |

The update mutation's variables carry `entityType` alongside `id`, both captured inside the debounce callback when it is scheduled — the deferred-dispatch carve-out in `.claude/rules/src-data-access-layer.md` exists so a scheduled write targets the entity being edited when the debounce started, and the entity type is part of that target (it selects the error label and both invalidated keys). Keep the existing carve-out comment above the `mutate()` call.

No change (read to derive this SF's changes): `app/src/data-access-layer/mergeUpdate.ts` (its `{ [K in keyof T]?: T[K] | undefined }` patch type accepts the `BaseEntity` update patch), `app/src/data-access-layer/useDuplicateMutation.ts`, and `app/src/data-access-layer/images/ensureImagePainted.ts` (`imageId: string | null`).

### `base-entities/index.ts`

Explicit named exports; keys stay internal:

- `export { useBaseEntities } from './useBaseEntities';`
- `export { useBaseEntity } from './useBaseEntity';`
- `export { baseEntityListQueryOptions, baseEntityQueryOptions } from './baseEntityQueryOptions';`

### `data-access-layer/index.ts`

Insert after line 8 (`export { ensureImagePainted } from './images';`), explicit named exports:

- `export { useBaseEntities, useBaseEntity } from './base-entities';`
- `export { baseEntityListQueryOptions, baseEntityQueryOptions } from './base-entities';`

### `mentionPrefetchByType.ts`

Remove the six imports from `'../npcs'`, `'../foes'`, `'../pcs'`, `'../factions'`, `'../locations'`, `'../items'`. Add `import type { BaseEntityType } from '@domain/entities';` and `import { baseEntityQueryOptions } from '../base-entities';`. Add a module-private factory below the `MentionPrefetch` type:

```ts
const prefetchBaseEntity =
  (entityType: BaseEntityType): MentionPrefetch =>
  async (queryClient, entityId) => {
    const baseEntity = await queryClient.ensureQueryData(
      baseEntityQueryOptions(entityType, entityId),
    );
    await ensureImagePainted(queryClient, baseEntity.image_id);
  };
```

The six map entries become `npcs: prefetchBaseEntity('npcs')`, `foes: prefetchBaseEntity('foes')`, `pcs: prefetchBaseEntity('pcs')`, `factions: prefetchBaseEntity('factions')`, `locations: prefetchBaseEntity('locations')`, `items: prefetchBaseEntity('items')`. The `sessions` and `encounters` entries, the map's `Record<MentionEntityType, MentionPrefetch>` type, its comment, and the `mentionPrefetchByType` export are unchanged (KAD: Dispatch sites…). `image_id` is passed without `?? null` (KAD: The schema follows the current `zodSchema` rule).

`app/src/data-access-layer/` has no hook test convention (`__tests__/` holds only `mergeUpdate.test.ts`); no test file is added.

### Cross-SF consumers

- `useBaseEntities` — SF6 `BaseEntitiesScreen.tsx`, `AdventureStats.tsx`
- `useBaseEntity` — SF6 `BaseEntityScreen.tsx`, `BaseEntitySidebar.tsx`, `BaseEntityDuplicateBtn.tsx`, `BaseEntityPopupContent.tsx`, `BaseEntityCrumb.tsx`
- `baseEntityListQueryOptions` — SF6 the six list route files
- `baseEntityQueryOptions` — SF6 the six detail route files (also consumed in this SF by `mentionPrefetchByType.ts`)

All SF6 consumers import through `'@/data-access-layer'`, which re-exports from `./base-entities`, which re-exports from the owning files.

### Modified-file scan

`data-access-layer/index.ts` and `mentionPrefetchByType.ts` contain no JSX and no `void`-context `return null`. No other violation found.
