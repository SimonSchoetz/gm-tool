import { useState } from 'react';
import { Channel } from '@tauri-apps/api/core';
import { useMutation, useQuery } from '@tanstack/react-query';
import * as updaterService from '@services/updaterService';
import type { DownloadProgressEvent, UpdateCheckError } from '@domain';
import { updaterKeys } from './updaterKeys';
import { getVersion } from '@tauri-apps/api/app';

type UseUpdater = {
  currentVersion: string | null;
  availableVersion: string | null;
  isChecking: boolean;
  checkError: UpdateCheckError | null;
  checkUpdate: () => void;
  downloadUpdate: () => Promise<void>;
  isDownloading: boolean;
  downloadProgress: number | null;
  isDownloaded: boolean;
  installAndRelaunch: () => Promise<void>;
  isInstalling: boolean;
};

export const useUpdater = (): UseUpdater => {
  const [downloaded, setDownloaded] = useState(0);
  const [total, setTotal] = useState<number | null>(null);
  const { data: currentVersion } = useQuery({
    queryKey: updaterKeys.appVersion(),
    queryFn: getVersion,
    throwOnError: true,
  });

  // throwOnError is intentionally omitted — this is a non-blocking background check. Startup failures must be silent; settings UI handles errors locally via checkError. The Error Boundary is not the correct destination for update check failures.
  const {
    data: availableVersion,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: updaterKeys.check(),
    // Skip network check in dev — endpoint is not available locally
    queryFn: import.meta.env.DEV
      ? () => Promise.resolve(null)
      : updaterService.checkUpdate,

    staleTime: Infinity,
  });

  const downloadUpdate = useMutation({
    mutationFn: async () => {
      setDownloaded(0);
      setTotal(null);
      const channel = new Channel<DownloadProgressEvent>((event) => {
        setDownloaded((prev) => prev + event.data.chunkLength);
        if (event.data.contentLength !== null) {
          setTotal(event.data.contentLength);
        }
      });
      await updaterService.downloadUpdate(channel);
    },
  });

  const downloadProgress =
    total !== null && total > 0 ? Math.round((downloaded / total) * 100) : null;

  const installAndRelaunch = useMutation({
    mutationFn: updaterService.installAndRelaunch,
  });

  return {
    currentVersion: currentVersion ?? null,
    availableVersion: availableVersion ?? null,
    isChecking: isFetching,
    checkError:
      error?.name === 'UpdateCheckError' ? (error as UpdateCheckError) : null,
    checkUpdate: () => {
      void refetch();
    },
    downloadUpdate: () => downloadUpdate.mutateAsync(),
    isDownloading: downloadUpdate.isPending,
    downloadProgress,
    isDownloaded: downloadUpdate.isSuccess,
    installAndRelaunch: () => installAndRelaunch.mutateAsync(),
    isInstalling: installAndRelaunch.isPending,
  };
};
