# SF3: Live entity resolution hook

Wraps SF2's `getMentionEntityData` in a TanStack Query hook, following the exact `staleTime`/`refetchOnMount` convention already used by every per-entity detail hook in this codebase (`useFoe`, `useNpc`, etc.) so a mention badge shows the freshest name on every mount, with no cross-module cache-invalidation wiring required (root spec KAD "No cross-module cache invalidation wiring; freshness follows the existing per-mount convention").

## Files affected

**New:**

- `data-access-layer/mentions/mentionEntityKeys.ts`
- `data-access-layer/mentions/useMentionEntityData.ts`
- `data-access-layer/mentions/index.ts`

**Modified:**

- `data-access-layer/index.ts` — add one export line

## Layered breakdown

### Data Access Layer

**`data-access-layer/mentions/mentionEntityKeys.ts` (new)**

```ts
export const mentionEntityKeys = {
  detail: (entityType: string, entityId: string) =>
    ['mentionEntityData', entityType, entityId] as const,
};
```

Not exported from this module's barrel — query key factories are internal to their DAL module per `app/src/CLAUDE.md`'s Barrel Files rule, identical to `foeKeys`/`npcKeys` in the existing per-entity modules.

**`data-access-layer/mentions/useMentionEntityData.ts` (new)**

```ts
import { useQuery } from '@tanstack/react-query';
import * as service from '@services/mentionSearchService';
import { mentionEntityKeys } from './mentionEntityKeys';

type UseMentionEntityDataReturn = {
  name: string | null;
  deleted: boolean;
  loading: boolean;
};

export const useMentionEntityData = (
  entityId: string,
  entityType: string,
): UseMentionEntityDataReturn => {
  const { data, isPending: loading } = useQuery({
    queryKey: mentionEntityKeys.detail(entityType, entityId),
    queryFn: () => service.getMentionEntityData(entityType, entityId),
    enabled: !!entityId,
    staleTime: 0,
    refetchOnMount: 'always',
    throwOnError: true,
  });

  return {
    name: data?.name ?? null,
    deleted: data?.deleted ?? false,
    loading,
  };
};
```

`throwOnError: true` is correct here, not the non-blocking-background-check exception: `getMentionEntityData` (SF2) never throws for a missing or unrecognized entity — that path returns `{ name: null, deleted: true }` as a normal result. The only rejection this query can see is a genuine, unexpected DB failure, which — exactly like every other entity-detail hook in this codebase — belongs on the Error Boundary.

**`data-access-layer/mentions/index.ts` (new)** — module directory barrel, explicit named export (single hook, no internals to leak beyond the key factory, which stays unexported per the rule above):

```ts
export { useMentionEntityData } from './useMentionEntityData';
```

**`data-access-layer/index.ts` (modified)** — grouping barrel, add one line directly after the existing `export { useTableConfig, useTableConfigs } from './table-config';` line:

```ts
export { useMentionEntityData } from './mentions';
```

## Test coverage

No test file is added. `useMentionEntityData` is a thin `useQuery` wrapper with no branching logic of its own beyond the `?? null` / `?? false` defaults already exercised identically, and untested, by every existing per-entity hook (`useFoe`, `useNpc`, etc.) in `data-access-layer/`. No DAL hook in this codebase currently has a test file — this follows that existing, established absence of convention.
