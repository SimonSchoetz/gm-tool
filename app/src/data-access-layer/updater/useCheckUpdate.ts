import { useQuery } from '@tanstack/react-query';
import * as updaterService from '@services/updaterService';
import type { UpdateCheckError } from '@domain';
import { updaterKeys } from './updaterKeys';

type UseCheckUpdateReturn = {
  availableVersion: string | null;
  isChecking: boolean;
  checkError: UpdateCheckError | null;
  checkUpdate: () => void;
};

export const useCheckUpdate = (): UseCheckUpdateReturn => {
  // throwOnError is intentionally omitted — this is a non-blocking background check. Startup failures must be silent; settings UI handles errors locally via checkError. The Error Boundary is not the correct destination for update check failures.
  const { data, isFetching, error, refetch } = useQuery({
    queryKey: updaterKeys.check(),
    // Skip network check in dev — endpoint is not available locally
    queryFn: import.meta.env.DEV
      ? () => Promise.resolve(null)
      : updaterService.checkUpdate,

    staleTime: Infinity,
  });

  return {
    availableVersion: data ?? null,
    isChecking: isFetching,
    checkError:
      error?.name === 'UpdateCheckError' ? (error as UpdateCheckError) : null,
    checkUpdate: () => {
      void refetch();
    },
  };
};
