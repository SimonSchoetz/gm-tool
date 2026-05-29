import { useQuery } from '@tanstack/react-query';
import { getVersion } from '@tauri-apps/api/app';
import { updaterKeys } from './updaterKeys';

type UseAppVersionReturn = {
  currentVersion: string | null;
};

export const useAppVersion = (): UseAppVersionReturn => {
  const { data } = useQuery({
    queryKey: updaterKeys.appVersion(),
    queryFn: getVersion,
    throwOnError: true,
  });

  return { currentVersion: data ?? null };
};
