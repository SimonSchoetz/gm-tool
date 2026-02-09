import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Npc } from '@db/npc';
import * as service from '@/services/npcsService';

type UseNpcsReturn = {
  npcs: Npc[];
  loading: boolean;
  createNpc: (adventureId: string) => Promise<string>;
};

export const useNpcs = (adventureId: string): UseNpcsReturn => {
  const queryClient = useQueryClient();

  // Query: Fetch all NPCs for an adventure
  const { data: npcs = [], isPending: isLoadingNpcs } = useQuery({
    queryKey: ['npcs', adventureId],
    queryFn: () => service.getAllNpcs(adventureId),
    enabled: !!adventureId,
  });

  // Mutation: Create NPC
  const createMutation = useMutation({
    mutationFn: (adventureId: string) => service.createNpc(adventureId),
    onSuccess: (_id, adventureId) => {
      queryClient.invalidateQueries({ queryKey: ['npcs', adventureId] });
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
