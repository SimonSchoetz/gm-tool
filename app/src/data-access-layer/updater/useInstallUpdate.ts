import { useMutation } from '@tanstack/react-query';
import * as updaterService from '@services/updaterService';

type UseInstallUpdateReturn = {
  installUpdate: () => Promise<void>;
  isInstalling: boolean;
};

export const useInstallUpdate = (): UseInstallUpdateReturn => {
  const mutation = useMutation({
    mutationFn: updaterService.installUpdate,
  });

  return {
    installUpdate: () => mutation.mutateAsync(),
    isInstalling: mutation.isPending,
  };
};
