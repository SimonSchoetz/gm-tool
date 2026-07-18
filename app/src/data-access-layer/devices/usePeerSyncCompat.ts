import { useQuery } from '@tanstack/react-query';
import { deviceKeys } from './deviceKeys';

export type PeerCompatMap = Partial<
  Record<string, 'compatible' | 'incompatible'>
>;

type UsePeerSyncCompatReturn = {
  compatById: PeerCompatMap;
};

export const usePeerSyncCompat = (): UsePeerSyncCompatReturn => {
  const { data } = useQuery({
    queryKey: deviceKeys.syncCompat(),
    queryFn: () => Promise.resolve({}),
    throwOnError: true,
    // The cache is event-maintained by useConnectivityLifecycle; refetching on the
    // default stale timer would race the event stream.
    staleTime: Infinity,
  });

  return { compatById: data ?? {} };
};
