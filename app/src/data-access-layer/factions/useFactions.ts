import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Faction } from '@db/faction';
import * as service from '@services/factionsService';
import { factionKeys } from './factionKeys';

type UseFactionsReturn = {
  factions: Faction[];
  loading: boolean;
  createFaction: () => Promise<string>;
};

export const useFactions = (adventureId: string): UseFactionsReturn => {
  const queryClient = useQueryClient();

  const { data: factions = [], isPending: isLoadingFactions } = useQuery({
    queryKey: factionKeys.list(adventureId),
    queryFn: () => service.getAllFactions(adventureId),
    enabled: !!adventureId,
    throwOnError: true,
  });

  const createMutation = useMutation({
    mutationFn: () => service.createFaction(adventureId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: factionKeys.list(adventureId),
      });
    },
  });

  const createFaction = async (): Promise<string> => createMutation.mutateAsync();

  return {
    factions,
    loading: isLoadingFactions,
    createFaction,
  };
};
