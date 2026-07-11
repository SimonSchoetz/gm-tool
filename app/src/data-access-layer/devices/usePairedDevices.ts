import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { PairedDevice } from '@db/paired-device';
import * as devicesService from '@services/devicesService';
import { deviceKeys } from './deviceKeys';

type UsePairedDevicesReturn = {
  pairedDevices: PairedDevice[];
  loading: boolean;
  forgetDevice: (endpointId: string) => Promise<void>;
};

export const usePairedDevices = (): UsePairedDevicesReturn => {
  const queryClient = useQueryClient();

  const { data: pairedDevices = [], isPending: loading } = useQuery({
    queryKey: deviceKeys.paired(),
    queryFn: devicesService.getPairedDevices,
    throwOnError: true,
  });

  const forgetMutation = useMutation({
    mutationFn: (endpointId: string) => devicesService.forgetDevice(endpointId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: deviceKeys.paired() });
      void queryClient.invalidateQueries({ queryKey: deviceKeys.connected() });
    },
  });

  // The id is genuinely call-time data — the hook serves the whole list, so no
  // construction-time id exists to close over.
  const forgetDevice = async (endpointId: string): Promise<void> => {
    await forgetMutation.mutateAsync(endpointId);
  };

  return {
    pairedDevices,
    loading,
    forgetDevice,
  };
};
