import { useMutation } from '@tanstack/react-query';
import * as updaterService from '@services/updaterService';

type UseInstallAndRelaunchReturn = {
  installAndRelaunch: () => Promise<void>;
  isInstalling: boolean;
};

export const useInstallAndRelaunch = (): UseInstallAndRelaunchReturn => {
  const mutation = useMutation({
    mutationFn: updaterService.installAndRelaunch,
  });

  return {
    installAndRelaunch: () => mutation.mutateAsync(),
    isInstalling: mutation.isPending,
  };
};
