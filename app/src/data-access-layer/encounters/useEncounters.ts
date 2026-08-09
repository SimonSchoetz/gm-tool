import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Encounter } from '@db/encounter';
import * as service from '@services/encountersService';
import { encounterKeys } from './encounterKeys';
import { encounterListQueryOptions } from './encounterQueryOptions';

type UseEncountersReturn = {
  encounters: Encounter[];
  loading: boolean;
  createEncounter: () => Promise<string>;
};

export const useEncounters = (adventureId: string): UseEncountersReturn => {
  const queryClient = useQueryClient();

  const { data: encounters = [], isPending: isLoadingEncounters } = useQuery(
    encounterListQueryOptions(adventureId),
  );

  const createMutation = useMutation({
    mutationFn: () => service.createEncounter(adventureId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: encounterKeys.list(adventureId),
      });
    },
  });

  const createEncounter = async (): Promise<string> =>
    createMutation.mutateAsync();

  return {
    encounters,
    loading: isLoadingEncounters,
    createEncounter,
  };
};
