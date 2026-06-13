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

  return {
    downloadUpdate: () => mutation.mutateAsync(),
    isDownloading: mutation.isPending,
    downloadProgress,
    isDownloaded: mutation.isSuccess,
  };
};
