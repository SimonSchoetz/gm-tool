import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Location } from '@db/location';
import * as service from '@services/locationsService';
import { locationKeys } from './locationKeys';

type UseLocationsReturn = {
  locations: Location[];
  loading: boolean;
  createLocation: () => Promise<string>;
};

export const useLocations = (adventureId: string): UseLocationsReturn => {
  const queryClient = useQueryClient();

  const { data: locations = [], isPending: isLoadingLocations } = useQuery({
    queryKey: locationKeys.list(adventureId),
    queryFn: () => service.getAllLocations(adventureId),
    enabled: !!adventureId,
    throwOnError: true,
  });

  const createMutation = useMutation({
    mutationFn: () => service.createLocation(adventureId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: locationKeys.list(adventureId),
      });
    },
  });

  const createLocation = async (): Promise<string> => createMutation.mutateAsync();

  return {
    locations,
    loading: isLoadingLocations,
    createLocation,
  };
};
