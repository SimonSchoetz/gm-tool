# SF3: Updater Domain, Service, and DAL

Creates the typed error vocabulary for updater failures, the service wrapping the two Tauri
commands, three DAL hooks (`useAppVersion`, `useCheckUpdate`, `useInstallUpdate`), and wires the
auto-check into `App.tsx`.

## Files Affected

```
New:
  domain/updater/errors.ts
  domain/updater/index.ts
  services/updaterService.ts
  src/data-access-layer/updater/updaterKeys.ts
  src/data-access-layer/updater/useAppVersion.ts
  src/data-access-layer/updater/useCheckUpdate.ts
  src/data-access-layer/updater/useInstallUpdate.ts
  src/data-access-layer/updater/index.ts

Modified:
  domain/index.ts
  src/data-access-layer/index.ts
  src/App.tsx
```

## Domain Layer

### `domain/updater/errors.ts`

Follow the factory function pattern from `app/CLAUDE.md` — Error & { name } type + factory,
never class-based.

```ts
export type UpdateCheckError = Error & { name: 'UpdateCheckError' };
export const updateCheckError = (cause?: unknown): UpdateCheckError => {
  const error = new Error(
    `Failed to check for updates: ${String(cause)}`,
  ) as UpdateCheckError;
  error.name = 'UpdateCheckError';
  return error;
};

export type UpdateInstallError = Error & { name: 'UpdateInstallError' };
export const updateInstallError = (cause?: unknown): UpdateInstallError => {
  const error = new Error(
    `Failed to install update: ${String(cause)}`,
  ) as UpdateInstallError;
  error.name = 'UpdateInstallError';
  return error;
};
```

### `domain/updater/index.ts`

```ts
export type { UpdateCheckError, UpdateInstallError } from './errors';
export { updateCheckError, updateInstallError } from './errors';
```

### `domain/index.ts`

Add updater exports after the existing `table-config` block. Use explicit named exports — `export *`
is banned in the grouping barrel.

```ts
export type { UpdateCheckError, UpdateInstallError } from './updater';
export { updateCheckError, updateInstallError } from './updater';
```

## Services Layer

### `services/updaterService.ts`

Both functions import `invoke` from `@tauri-apps/api/core` — the same import used in
`imageService.ts`. No service barrel exists; consumers import directly via
`@services/updaterService`.

```ts
import { invoke } from '@tauri-apps/api/core';
import { updateCheckError, updateInstallError } from '@domain';

export const checkUpdate = async (): Promise<string | null> => {
  try {
    return await invoke<string | null>('check_update');
  } catch (cause) {
    throw updateCheckError(cause);
  }
};

export const installUpdate = async (): Promise<void> => {
  try {
    await invoke<void>('install_update');
  } catch (cause) {
    throw updateInstallError(cause);
  }
};
```

## Data Access Layer

### `src/data-access-layer/updater/updaterKeys.ts`

```ts
export const updaterKeys = {
  check: () => ['updater', 'check'] as const,
  appVersion: () => ['updater', 'appVersion'] as const,
};
```

### `src/data-access-layer/updater/useAppVersion.ts`

`getVersion()` from `@tauri-apps/api/app` is a Tauri metadata API with no business logic or
realistic error path. It is called directly in this hook without a service wrapper — see Key
Architectural Decisions in the root spec.

`throwOnError: true` is required by project convention. In the unlikely event that `getVersion()`
fails, the Error Boundary catches it.

```ts
import { useQuery } from '@tanstack/react-query';
import { getVersion } from '@tauri-apps/api/app';
import { updaterKeys } from './updaterKeys';

type UseAppVersionReturn = {
  currentVersion: string | null;
};

export const useAppVersion = (): UseAppVersionReturn => {
  const { data } = useQuery({
    queryKey: updaterKeys.appVersion(),
    queryFn: getVersion,
    throwOnError: true,
  });

  return { currentVersion: data ?? null };
};
```

### `src/data-access-layer/updater/useCheckUpdate.ts`

`staleTime: Infinity` prevents background auto-refetch — the check only runs on mount (via
`App.tsx`) and when `checkUpdate()` is explicitly called.

The `checkUpdate` wrapper uses `void refetch()` to satisfy `@typescript-eslint/no-misused-promises`
when the returned function is assigned to a `() => void` typed slot.

```ts
import { useQuery } from '@tanstack/react-query';
import * as updaterService from '@services/updaterService';
import { updaterKeys } from './updaterKeys';

type UseCheckUpdateReturn = {
  availableVersion: string | null;
  isChecking: boolean;
  checkUpdate: () => void;
};

export const useCheckUpdate = (): UseCheckUpdateReturn => {
  const { data, isFetching, refetch } = useQuery({
    queryKey: updaterKeys.check(),
    queryFn: updaterService.checkUpdate,
    staleTime: Infinity,
    throwOnError: true,
  });

  return {
    availableVersion: data ?? null,
    isChecking: isFetching,
    checkUpdate: () => { void refetch(); },
  };
};
```

### `src/data-access-layer/updater/useInstallUpdate.ts`

After a successful install the Tauri updater restarts the app automatically — no cache
invalidation or success state is needed.

```ts
import { useMutation } from '@tanstack/react-query';
import * as updaterService from '@services/updaterService';

type UseInstallUpdateReturn = {
  installUpdate: () => Promise<void>;
  isInstalling: boolean;
};

export const useInstallUpdate = (): UseInstallUpdateReturn => {
  const mutation = useMutation({
    mutationFn: updaterService.installUpdate,
  });

  return {
    installUpdate: () => mutation.mutateAsync(),
    isInstalling: mutation.isPending,
  };
};
```

### `src/data-access-layer/updater/index.ts`

Module directory barrel — explicit named exports.

```ts
export { useAppVersion } from './useAppVersion';
export { useCheckUpdate } from './useCheckUpdate';
export { useInstallUpdate } from './useInstallUpdate';
export { updaterKeys } from './updaterKeys';
```

### `src/data-access-layer/index.ts`

Add updater exports after the existing `session-steps` line:

```ts
export { useAppVersion, useCheckUpdate, useInstallUpdate, updaterKeys } from './updater';
```

### `src/App.tsx`

Call `useCheckUpdate()` at the top of the `App` component to trigger the auto-check on app start.
The return value is not used — the hook's side effect (populating the TanStack Query cache) is
what matters here. `AppVersionSection` reads from the same cache key.

Add the hook call as the first statement inside the component body, before the return:

```tsx
export const App = () => {
  useCheckUpdate();
  return (
    // existing JSX unchanged
  );
};
```

Import `useCheckUpdate` from `@/data-access-layer`.
