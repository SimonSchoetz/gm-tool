import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Npc } from '@db/npc';
import * as service from '@/services/npcsService';
import { npcKeys } from './npcKeys';

export type UseNpcsReturn = {
  npcs: Npc[];
  loading: boolean;
  createNpc: (adventureId: string) => Promise<string>;
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
    mutationFn: (adventureId: string) => service.createNpc(adventureId),
    onSuccess: (_id, adventureId) => {
      queryClient.invalidateQueries({ queryKey: npcKeys.list(adventureId) });
    },
  });

  const createNpc = async (adventureId: string): Promise<string> => {
    return createMutation.mutateAsync(adventureId);
  };

  return {
    npcs,
    loading: isLoadingNpcs,
    createNpc,
  };
};
