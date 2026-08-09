import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Adventure } from '@db/adventure';
import * as service from '@services/adventureService';
import { adventureKeys } from './adventureKeys';
import { adventureListQueryOptions } from './adventureQueryOptions';

type UseAdventuresReturn = {
  adventures: Adventure[];
  loading: boolean;
  createAdventure: () => Promise<string>;
  deleteAdventure: (id: string) => Promise<void>;
};

export const useAdventures = (): UseAdventuresReturn => {
  const queryClient = useQueryClient();

  const { data: adventures = [], isPending: loading } = useQuery(
    adventureListQueryOptions(),
  );

  const createMutation = useMutation({
    mutationFn: service.createAdventure,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adventureKeys.list() });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (adventureId: string) => service.deleteAdventure(adventureId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adventureKeys.list() });
    },
  });

  const createAdventure = async (): Promise<string> => {
    return createMutation.mutateAsync();
  };

  const deleteAdventure = async (adventureId: string): Promise<void> => {
    await deleteMutation.mutateAsync(adventureId);
  };

  return {
    adventures,
    loading,
    createAdventure,
    deleteAdventure,
  };
};
