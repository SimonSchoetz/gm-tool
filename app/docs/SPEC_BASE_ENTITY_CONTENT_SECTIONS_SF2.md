# SF2 — Content section service and data access

Expose the SF1 db module through a service with typed domain errors and through a TanStack Query hook, `useBaseEntityContentSections`. Additive: the hook and the list query-options factory get their consumers in SF3 (`BaseEntityScreen.tsx`, `BaseEntityPopupContent.tsx`, `mentionPrefetchByType.ts`). `createSection`, `deleteSection`, and `bulkReorder` stay unconsumed by any screen after SF3 by design — see KAD "Full CRUD surface ahead of its UI".

## Files affected

- `New:` `app/services/baseEntityContentSectionService.ts`
- `New:` `app/src/data-access-layer/base-entity-content-sections/baseEntityContentSectionKeys.ts`
- `New:` `app/src/data-access-layer/base-entity-content-sections/baseEntityContentSectionQueryOptions.ts`
- `New:` `app/src/data-access-layer/base-entity-content-sections/useBaseEntityContentSections.ts`
- `New:` `app/src/data-access-layer/base-entity-content-sections/index.ts`
- `Modified:` `app/src/data-access-layer/index.ts` — export the new hook

## 4. Services

### `services/baseEntityContentSectionService.ts`

Named for the single db module it wraps (`app/services/CLAUDE.md` — `@db/base-entity-content-section` → `baseEntityContentSectionService.ts`). Imports: `import * as baseEntityContentSectionDb from '@db/base-entity-content-section'`, the db types from `'@db/base-entity-content-section'`, the five error factories and `type BaseEntityContentSectionType` from `'@domain'`.

Reference: `services/sessionStepService.ts`, which complies with `app/services/CLAUDE.md` (every export wraps its db calls in try/catch and throws a domain error). Exports, each wrapping its body in try/catch and throwing the listed error:

| Export | Signature | Body | Error thrown |
| --- | --- | --- | --- |
| `getSectionsByBaseEntityId` | `(baseEntityId: string) => Promise<BaseEntityContentSection[]>` | `getAllByBaseEntity(baseEntityId)` | `baseEntityContentSectionLoadError(err)` |
| `createSection` | `(baseEntityId: string, type: BaseEntityContentSectionType, name?: string) => Promise<string>` | as `createCustomStep`: read all sections of the entity, `sort_order` = max existing `sort_order` + 1 (0 when none), then `create({ base_entity_id, type, sort_order, ...(name !== undefined ? { name } : {}) })` | `baseEntityContentSectionCreateError(err)` |
| `updateSection` | `(id: string, data: UpdateBaseEntityContentSectionInput) => Promise<void>` | `update(id, data)` | `baseEntityContentSectionUpdateError(id, err)` |
| `deleteSection` | `(id: string) => Promise<void>` | `remove(id)` | `baseEntityContentSectionDeleteError(id, err)` |
| `bulkReorderSections` | `(orderedSectionIds: string[]) => Promise<void>` | as `bulkReorderSteps`: `update(orderedSectionIds[index], { sort_order: index })` for each index in order | `baseEntityContentSectionReorderError(err)` |

No swap-with-neighbour function (`sessionStepService.swapStepOrder` has no counterpart) and no counterpart to `sessionStepService.createStep`.

## 5. Data Access Layer

Module directory `src/data-access-layer/base-entity-content-sections/`, one concern per file (`.claude/rules/src-data-access-layer.md` — Layer responsibilities). Reference: `src/data-access-layer/session-steps/`, which complies with that rules file. Substitution for all three non-barrel files:

| Reference | New |
| --- | --- |
| `session-steps/` | `base-entity-content-sections/` |
| `sessionStepKeys` / key root `'session-steps'` | `baseEntityContentSectionKeys` / `'base-entity-content-sections'` |
| `sessionStepListQueryOptions` | `baseEntityContentSectionListQueryOptions` |
| `useSessionSteps` / `UseSessionStepsReturn` | `useBaseEntityContentSections` / `UseBaseEntityContentSectionsReturn` |
| `@services/sessionStepService` | `@services/baseEntityContentSectionService` |
| `service.getStepsBySessionId` | `service.getSectionsByBaseEntityId` |
| `service.updateStep` / `createCustomStep` / `deleteStep` / `bulkReorderSteps` | `service.updateSection` / `createSection` / `deleteSection` / `bulkReorderSections` |
| `sessionId` (hook parameter, key argument) | `baseEntityId` |
| `SessionStep` / `UpdateSessionStepInput` from `@db/session-step` | `BaseEntityContentSection` / `UpdateBaseEntityContentSectionInput` from `@db/base-entity-content-section` |
| `stepId`, `orderedStepIds`, `steps` | `sectionId`, `orderedSectionIds`, `sections` |
| return fields `updateStep` / `createStep` / `deleteStep` / `bulkReorder` | `updateSection` / `createSection` / `deleteSection` / `bulkReorder` |

### `baseEntityContentSectionKeys.ts`

`list: (baseEntityId: string) => ['base-entity-content-sections', baseEntityId] as const`. Internal to the module — never exported from either barrel (`.claude/rules/src-data-access-layer.md` — Query keys are internal to the module). The key root does not start with `device`, so the sync-applied invalidation in `useConnectivityLifecycle.ts` (predicate: first key segment is a string not starting with `'device'`) refreshes it after a peer sync.

### `baseEntityContentSectionQueryOptions.ts`

`baseEntityContentSectionListQueryOptions(baseEntityId)` — same options as `sessionStepListQueryOptions` (`enabled: !!baseEntityId`, `throwOnError: true`, no `staleTime` override). Only this hook writes section rows for an existing entity, and it updates the cache optimistically, so the default stale time does not leave the screen showing outdated content.

### `useBaseEntityContentSections.ts`

Same structure as `useSessionSteps` (per-section debounce map with 500 ms timeout, cleanup effect, optimistic `setQueryData` with `mergeUpdate`, deferred-dispatch `updateMutation` taking `{ id, data }`, invalidate-on-success for create and delete, invalidate-on-error for bulk reorder), with these differences:

- Return type:

  ```ts
  type UseBaseEntityContentSectionsReturn = {
    sections: BaseEntityContentSection[];
    summarySection: BaseEntityContentSection | null;
    loading: boolean;
    createSection: (
      type: BaseEntityContentSectionType,
      name?: string,
    ) => Promise<string>;
    updateSection: (
      sectionId: string,
      data: UpdateBaseEntityContentSectionInput,
    ) => void;
    deleteSection: (sectionId: string) => Promise<void>;
    bulkReorder: (orderedSectionIds: string[]) => void;
  };
  ```

  `BaseEntityContentSectionType` is a type import from `'@domain'`.
- **No `reorderSteps` counterpart** and no call to a swap service function.
- **`summarySection`** is `sections.find((section) => section.type === 'text') ?? null`, computed after the `useQuery` destructuring. The list arrives `ORDER BY sort_order ASC` from the db and `bulkReorder`'s optimistic update keeps it in that order, so `find` returns the lowest-`sort_order` text section (KAD "The summary is the first `text` section; no text section hides the summary panel").
- **`createMutation`** takes variables `{ type: BaseEntityContentSectionType; name?: string }` and calls `service.createSection(baseEntityId, type, name)`; its `onSuccess` invalidates `baseEntityContentSectionKeys.list(baseEntityId)`. The `createSection` wrapper calls `createMutation.mutateAsync(name !== undefined ? { type, name } : { type })` — the conditional object is required because `exactOptionalPropertyTypes` rejects `{ type, name }` when `name` is `undefined`.

### `base-entity-content-sections/index.ts`

Explicit named exports (module barrel with a private key factory, `app/src/CLAUDE.md` — Barrel Files): `export { useBaseEntityContentSections } from './useBaseEntityContentSections';` and `export { baseEntityContentSectionListQueryOptions } from './baseEntityContentSectionQueryOptions';`. The query-options factory is consumed in SF3 by the sibling module file `data-access-layer/mentions/mentionPrefetchByType.ts` through this module barrel (`'../base-entity-content-sections'`), the same way it already imports `'../base-entities'`.

### `data-access-layer/index.ts`

Add `export { useBaseEntityContentSections } from './base-entity-content-sections';` directly after the two `./base-entities` export lines. Explicit named export — `export *` is banned in `src/` grouping barrels. `baseEntityContentSectionListQueryOptions` is not added to the grouping barrel: no route loader or other consumer outside `data-access-layer/` uses it.
