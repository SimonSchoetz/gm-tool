import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Npc } from '@db/npc';
import * as service from '@/services/npcsService';
import { npcKeys } from './npcKeys';

export type UseNpcsReturn = {
  npcs: Npc[];
  loading: boolean;
  createNpc: () => Promise<string>;
};

export const useNpcs = (adventureId: string): UseNpcsReturn => {
  const queryClient = useQueryClient();

  const { data: npcs = [], isPending: isLoadingNpcs } = useQuery({
    queryKey: npcKeys.list(adventureId),
    queryFn: () => service.getAllNpcs(adventureId),
    enabled: !!adventureId,
    throwOnError: true,
  });

  const createMutation = useMutation({
    mutationFn: () => service.createNpc(adventureId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: npcKeys.list(adventureId),
      });
    },
  });

  const createNpc = async (): Promise<string> => createMutation.mutateAsync();

  return {
    npcs,
    loading: isLoadingNpcs,
    createNpc,
  };
};
