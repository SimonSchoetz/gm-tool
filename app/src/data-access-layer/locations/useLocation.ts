import { useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Location } from '@db/location';
import * as service from '@services/locationsService';
import type { UpdateLocationData } from '@services/locationsService';
import { locationKeys } from './locationKeys';
import { mergeUpdate } from '../mergeUpdate';

type UseLocationReturn = {
  location: Location | null;
  loading: boolean;
  updateLocation: (data: UpdateLocationData) => void;
  deleteLocation: () => Promise<void>;
  removeLocationImage: () => Promise<void>;
};

export const useLocation = (locationId: string, adventureId: string): UseLocationReturn => {
  const queryClient = useQueryClient();
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingUpdatesRef = useRef<UpdateLocationData>({});

  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  const { data: locationData, isPending: isLoadingLocation } = useQuery({
    queryKey: locationKeys.detail(locationId),
    queryFn: () => service.getLocationById(locationId),
    enabled: !!locationId,
    staleTime: 0,
    refetchOnMount: 'always',
    throwOnError: true,
  });

  const updateMutation = useMutation({
    mutationFn: (data: UpdateLocationData) => service.updateLocation(locationId, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: locationKeys.detail(locationId) });
      void queryClient.invalidateQueries({
        queryKey: locationKeys.list(adventureId),
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => service.deleteLocation(locationId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: locationKeys.list(adventureId),
      });
    },
  });

  const removeLocationImageMutation = useMutation({
    mutationFn: () => service.removeLocationImage(locationId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: locationKeys.detail(locationId) });
      void queryClient.invalidateQueries({
        queryKey: locationKeys.list(adventureId),
      });
    },
  });

  const updateLocation = (data: UpdateLocationData) => {
    if (!locationData) return;

    queryClient.setQueryData<Location>(locationKeys.detail(locationId), (old) => {
      if (!old) return old;
      const { imgFilePath: _imgFilePath, ...patch } = data;
      return mergeUpdate(old, patch);
    });

    pendingUpdatesRef.current = {
      ...pendingUpdatesRef.current,
      ...data,
    };

    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      const updates = { ...pendingUpdatesRef.current };
      pendingUpdatesRef.current = {};
      debounceTimeoutRef.current = null;

      updateMutation.mutate(updates);
    }, 500);
  };

  const deleteLocation = async (): Promise<void> => {
    await deleteMutation.mutateAsync();
  };

  const removeLocationImage = async (): Promise<void> => {
    await removeLocationImageMutation.mutateAsync();
  };

  return {
    location: locationData ?? null,
    loading: isLoadingLocation,
    updateLocation,
    deleteLocation,
    removeLocationImage,
  };
};
