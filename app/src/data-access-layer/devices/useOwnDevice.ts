import { useEffect, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { DeviceData } from '@db/_system';
import * as devicesService from '@services/devicesService';
import { deviceKeys } from './deviceKeys';

type UseOwnDeviceReturn = {
  ownDevice: DeviceData | null;
  renameOwnDevice: (name: string) => void;
};

export const useOwnDevice = (): UseOwnDeviceReturn => {
  const queryClient = useQueryClient();
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

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

  const renameOwnDevice = (name: string) => {
    queryClient.setQueryData<DeviceData | null>(deviceKeys.own(), (old) =>
      old ? { ...old, name } : old,
    );

    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      debounceTimeoutRef.current = null;
      renameMutation.mutate(name);
    }, 500);
  };

  return {
    ownDevice: ownDevice ?? null,
    renameOwnDevice,
  };
};
