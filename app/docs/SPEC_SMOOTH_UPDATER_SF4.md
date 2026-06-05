# SF4: Services

[FOUNDATION: SF5, SF6 depend on this. Do not commit SF4 alone — run baseline checks only after SF3+SF4+SF5+SF6 are all complete. Stage as unit: (same list as SF3's Foundation annotation).]

Remove `installUpdate`. Add `downloadUpdate` (accepts a `Channel` for progress) and `installAndRelaunch`.

## Files Affected

- `Modified:` `app/services/updaterService.ts` — remove `installUpdate`; add `downloadUpdate` + `installAndRelaunch`

## Services Layer

### `updaterService.ts`

Remove the `installUpdate` export. Replace with two exports:

```ts
import { invoke, Channel } from '@tauri-apps/api/core';
import {
  updateCheckError,
  updateDownloadError,
  updateInstallAndRelaunchError,
  type UpdateCheckErrorReason,
  type DownloadProgressEvent,
} from '@domain';

const categorizeCheckError = (cause: unknown): UpdateCheckErrorReason => {
  const message = String(cause).toLowerCase();
  if (
    message.includes('os error') ||
    message.includes('dns') ||
    message.includes('connection refused') ||
    message.includes('network')
  ) {
    return 'network';
  }
  return 'server';
};

export const checkUpdate = async (): Promise<string | null> => {
  try {
    return await invoke<string | null>('check_update');
  } catch (cause) {
    throw updateCheckError(cause, categorizeCheckError(cause));
  }
};

export const downloadUpdate = async (
  onProgress: Channel<DownloadProgressEvent>,
): Promise<void> => {
  try {
    await invoke('download_update', { onEvent: onProgress });
  } catch (cause) {
    throw updateDownloadError(cause);
  }
};

export const installAndRelaunch = async (): Promise<void> => {
  try {
    await invoke('install_and_relaunch');
  } catch (cause) {
    throw updateInstallAndRelaunchError(cause);
  }
};
```

