import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { DeviceData } from '@db/_system';
import * as devicesService from '@services/devicesService';
import { deviceKeys } from './deviceKeys';
import { createAutosaveQueue } from '../createAutosaveQueue';

type UseOwnDeviceReturn = {
  ownDevice: DeviceData | null;
  renameOwnDevice: (name: string) => void;
};

export const useOwnDevice = (): UseOwnDeviceReturn => {
  const queryClient = useQueryClient();

  const { data: ownDevice } = useQuery({
    queryKey: deviceKeys.own(),
    queryFn: devicesService.getOwnDevice,
    throwOnError: true,
  });

  const renameMutation = useMutation({
    mutationFn: (name: string) => devicesService.renameOwnDevice(name),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: deviceKeys.own() });
    },
  });

  const [saveQueue] = useState(() =>
    createAutosaveQueue<string>(
      (_pending, name) => name,
      (_key, name) => {
        renameMutation.mutate(name);
      },
    ),
  );

  useEffect(() => {
    return () => {
      saveQueue.flushAll();
    };
  }, [saveQueue]);

  const renameOwnDevice = (name: string) => {
    queryClient.setQueryData<DeviceData | null>(deviceKeys.own(), (old) =>
      old ? { ...old, name } : old,
    );

    saveQueue.schedule('own-device', name);
  };

  return {
    ownDevice: ownDevice ?? null,
    renameOwnDevice,
  };
};
