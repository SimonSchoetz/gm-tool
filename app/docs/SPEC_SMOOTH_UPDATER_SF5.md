# SF5: DAL

[FOUNDATION: SF6 depends on this. Do not commit SF5 alone — run baseline checks only after SF3+SF4+SF5+SF6 are all complete. Stage as unit: (same list as SF3's Foundation annotation).]

Remove `useInstallUpdate`. Add `useDownloadUpdate` (with Channel-based progress state) and `useInstallAndRelaunch`. Update barrels.

## Files Affected

- `New:` `app/src/data-access-layer/updater/useDownloadUpdate.ts`
- `New:` `app/src/data-access-layer/updater/useInstallAndRelaunch.ts`
- `Modified:` `app/src/data-access-layer/updater/index.ts` — remove `useInstallUpdate`; add `useDownloadUpdate` + `useInstallAndRelaunch`
- `Modified:` `app/src/data-access-layer/index.ts` — remove `useInstallUpdate`; add `useDownloadUpdate` + `useInstallAndRelaunch`
- `Deleted:` `app/src/data-access-layer/updater/useInstallUpdate.ts`

## DAL Layer

### `useDownloadUpdate.ts`

```ts
import { useState } from 'react';
import { Channel } from '@tauri-apps/api/core';
import { useMutation } from '@tanstack/react-query';
import * as updaterService from '@services/updaterService';
import type { DownloadProgressEvent } from '@domain';

type UseDownloadUpdateReturn = {
  downloadUpdate: () => Promise<void>;
  isDownloading: boolean;
  downloadProgress: number | null;
  isDownloaded: boolean;
};

export const useDownloadUpdate = (): UseDownloadUpdateReturn => {
  const [downloaded, setDownloaded] = useState(0);
  const [total, setTotal] = useState<number | null>(null);

  const mutation = useMutation({
    mutationFn: async () => {
      setDownloaded(0);
      setTotal(null);
      const channel = new Channel<DownloadProgressEvent>((event) => {
        if (event.event === 'progress') {
          setDownloaded((prev) => prev + event.data.chunkLength);
          if (event.data.contentLength !== null) {
            setTotal(event.data.contentLength);
          }
        }
      });
      await updaterService.downloadUpdate(channel);
    },
  });

  const downloadProgress =
    total !== null && total > 0
      ? Math.round((downloaded / total) * 100)
      : null;

  return {
    downloadUpdate: () => mutation.mutateAsync(),
    isDownloading: mutation.isPending,
    downloadProgress,
    isDownloaded: mutation.isSuccess,
  };
};
```

`downloadProgress` is `null` when total size is unknown (the server did not send `Content-Length`). The component renders "Downloading..." without a percentage in that case.

`isDownloaded` uses `mutation.isSuccess` — it becomes `true` when the download Promise resolves and stays `true` until the mutation is reset. Since `installAndRelaunch` restarts the app, no explicit reset is needed.

### `useInstallAndRelaunch.ts`

```ts
import { useMutation } from '@tanstack/react-query';
import * as updaterService from '@services/updaterService';

type UseInstallAndRelaunchReturn = {
  installAndRelaunch: () => Promise<void>;
  isInstalling: boolean;
};

export const useInstallAndRelaunch = (): UseInstallAndRelaunchReturn => {
  const mutation = useMutation({
    mutationFn: updaterService.installAndRelaunch,
  });

  return {
    installAndRelaunch: () => mutation.mutateAsync(),
    isInstalling: mutation.isPending,
  };
};
```

### `data-access-layer/updater/index.ts`

```ts
export { useAppVersion } from './useAppVersion';
export { useCheckUpdate } from './useCheckUpdate';
export { useDownloadUpdate } from './useDownloadUpdate';
export { useInstallAndRelaunch } from './useInstallAndRelaunch';
export { updaterKeys } from './updaterKeys';
```

### `data-access-layer/index.ts`

On the updater re-export line, replace `useInstallUpdate` with `useDownloadUpdate` and `useInstallAndRelaunch`:

```ts
export { useAppVersion, useCheckUpdate, useDownloadUpdate, useInstallAndRelaunch, updaterKeys } from './updater';
```

All other re-exports in this file are unchanged.
