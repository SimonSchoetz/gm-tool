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
    checkUpdate: () => {
      void refetch();
    },
  };
};
