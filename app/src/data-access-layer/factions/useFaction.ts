import { useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Faction } from '@db/faction';
import * as service from '@services/factionsService';
import type { UpdateFactionData } from '@services/factionsService';
import { factionKeys } from './factionKeys';
import { mergeUpdate } from '../mergeUpdate';

type UseFactionReturn = {
  faction: Faction | null;
  loading: boolean;
  updateFaction: (data: UpdateFactionData) => void;
  deleteFaction: () => Promise<void>;
  removeFactionImage: () => Promise<void>;
};

export const useFaction = (factionId: string, adventureId: string): UseFactionReturn => {
  const queryClient = useQueryClient();
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingUpdatesRef = useRef<UpdateFactionData>({});

  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  const { data: factionData, isPending: isLoadingFaction } = useQuery({
    queryKey: factionKeys.detail(factionId),
    queryFn: () => service.getFactionById(factionId),
    enabled: !!factionId,
    staleTime: 0,
    refetchOnMount: 'always',
    throwOnError: true,
  });

  const updateMutation = useMutation({
    mutationFn: (data: UpdateFactionData) => service.updateFaction(factionId, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: factionKeys.detail(factionId) });
      void queryClient.invalidateQueries({
        queryKey: factionKeys.list(adventureId),
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => service.deleteFaction(factionId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: factionKeys.list(adventureId),
      });
    },
  });

  const removeFactionImageMutation = useMutation({
    mutationFn: () => service.removeFactionImage(factionId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: factionKeys.detail(factionId) });
      void queryClient.invalidateQueries({
        queryKey: factionKeys.list(adventureId),
      });
    },
  });

  const updateFaction = (data: UpdateFactionData) => {
    if (!factionData) return null;

    queryClient.setQueryData<Faction>(factionKeys.detail(factionId), (old) => {
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

  const deleteFaction = async (): Promise<void> => {
    await deleteMutation.mutateAsync();
  };

  const removeFactionImage = async (): Promise<void> => {
    await removeFactionImageMutation.mutateAsync();
  };

  return {
    faction: factionData ?? null,
    loading: isLoadingFaction,
    updateFaction,
    deleteFaction,
    removeFactionImage,
  };
};
