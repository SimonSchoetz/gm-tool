import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Pc } from '@db/pc';
import * as service from '@services/pcsService';
import { pcKeys } from './pcKeys';
import { pcListQueryOptions } from './pcQueryOptions';

type UsePcsReturn = {
  pcs: Pc[];
  loading: boolean;
  createPc: () => Promise<string>;
};

export const usePcs = (adventureId: string): UsePcsReturn => {
  const queryClient = useQueryClient();

  const { data: pcs = [], isPending: isLoadingPcs } = useQuery(
    pcListQueryOptions(adventureId),
  );

  const createMutation = useMutation({
    mutationFn: () => service.createPc(adventureId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: pcKeys.list(adventureId),
      });
    },
  });

  const createPc = async (): Promise<string> => createMutation.mutateAsync();

  return {
    pcs,
    loading: isLoadingPcs,
    createPc,
  };
};
