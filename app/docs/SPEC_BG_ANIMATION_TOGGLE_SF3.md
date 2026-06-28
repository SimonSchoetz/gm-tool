# SF3 — Settings DAL Module

Create `src/data-access-layer/settings/` and add its exports to the grouping barrel.

## Files Affected

```
New:      src/data-access-layer/settings/settingsKeys.ts
New:      src/data-access-layer/settings/useSetting.ts
New:      src/data-access-layer/settings/index.ts
Modified: src/data-access-layer/index.ts
```

## Data Access Layer

### `src/data-access-layer/settings/settingsKeys.ts`

```ts
import type { SettingsKey } from '@db/settings';

export const settingsKeys = {
  setting: (key: SettingsKey) => ['settings', key] as const,
};
```

Each setting key gets its own cache entry. TanStack Query caches `background` and any future key independently.

### `src/data-access-layer/settings/useSetting.ts`

```ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSetting, updateSetting } from '@db/settings';
import type { SettingsKey, SettingsValueMap } from '@db/settings';
import { settingsKeys } from './settingsKeys';

export const useSetting = <K extends SettingsKey>(
  key: K,
): { value: SettingsValueMap[K] | null; update: (value: SettingsValueMap[K]) => void } => {
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: settingsKeys.setting(key),
    queryFn: () => getSetting(key),
    throwOnError: true,
  });

  const mutation = useMutation({
    mutationFn: (value: SettingsValueMap[K]) => updateSetting(key, value),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: settingsKeys.setting(key),
      });
    },
  });

  const update = (value: SettingsValueMap[K]) => {
    mutation.mutate(value);
  };

  return {
    value: data ?? null,
    update,
  };
};
```

`data ?? null` collapses TanStack's `undefined` (loading state) to `null`. The explicit return type annotation is required — without it TypeScript widens `SettingsValueMap[K]` to a union of all value shapes. `update` is a named wrapper per the hook return type rule; it must not expose `mutation.mutate` directly.

### `src/data-access-layer/settings/index.ts`

```ts
export { useSetting } from './useSetting';
export { settingsKeys } from './settingsKeys';
```

### `src/data-access-layer/index.ts` — Modified

Add the following line (grouping barrel — explicit named exports only, no `export *`):

```ts
export { useSetting, settingsKeys } from './settings';
```

Insert after the last existing `export` line. The position does not affect runtime behaviour but should follow the alphabetical ordering of the existing entries (`sessions`, `session-steps`, `table-config`, `updater`).
