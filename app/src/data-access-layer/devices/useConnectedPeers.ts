import { useQuery } from '@tanstack/react-query';
import * as devicesService from '@services/devicesService';
import { deviceKeys } from './deviceKeys';

type UseConnectedPeersReturn = {
  connectedIds: string[];
};

export const useConnectedPeers = (): UseConnectedPeersReturn => {
  const { data: connectedIds = [] } = useQuery({
    queryKey: deviceKeys.connected(),
    queryFn: devicesService.getConnectedPeers,
    throwOnError: true,
    // The cache is event-maintained by useConnectivityLifecycle; refetching on the
    // default stale timer would race the event stream.
    staleTime: Infinity,
  });

  return { connectedIds };
};
