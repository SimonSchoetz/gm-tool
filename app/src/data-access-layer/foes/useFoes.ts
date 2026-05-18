import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Foe } from '@db/foe';
import * as service from '@services/foesService';
import { foeKeys } from './foeKeys';

export type UseFoesReturn = {
  foes: Foe[];
  loading: boolean;
  createFoe: () => Promise<string>;
};

export const useFoes = (adventureId: string): UseFoesReturn => {
  const queryClient = useQueryClient();

  const { data: foes = [], isPending: isLoadingFoes } = useQuery({
    queryKey: foeKeys.list(adventureId),
    queryFn: () => service.getAllFoes(adventureId),
    enabled: !!adventureId,
    throwOnError: true,
  });

  const createMutation = useMutation({
    mutationFn: () => service.createFoe(adventureId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: foeKeys.list(adventureId),
      });
    },
  });

  const createFoe = async (): Promise<string> => createMutation.mutateAsync();

  return {
    foes,
    loading: isLoadingFoes,
    createFoe,
  };
};
