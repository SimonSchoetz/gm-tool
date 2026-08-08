import { useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Encounter, UpdateEncounterInput } from '@db/encounter';
import * as service from '@services/encountersService';
import { encounterKeys } from './encounterKeys';
import { mergeUpdate } from '../mergeUpdate';

type UseEncounterReturn = {
  encounter: Encounter | null;
  loading: boolean;
  updateEncounter: (data: UpdateEncounterInput) => void;
  deleteEncounter: () => Promise<void>;
  duplicateEncounter: () => Promise<string>;
};

export const useEncounter = (
  encounterId: string,
  adventureId: string,
): UseEncounterReturn => {
  const queryClient = useQueryClient();
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingUpdatesRef = useRef<UpdateEncounterInput>({});

  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  const { data: encounterData, isPending: isLoadingEncounter } = useQuery({
    queryKey: encounterKeys.detail(encounterId),
    queryFn: () => service.getEncounterById(encounterId),
    enabled: !!encounterId,
    staleTime: 0,
    refetchOnMount: 'always',
    throwOnError: true,
  });

  const updateMutation = useMutation({
    mutationFn: (data: UpdateEncounterInput) =>
      service.updateEncounter(encounterId, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: encounterKeys.detail(encounterId),
      });
      void queryClient.invalidateQueries({
        queryKey: encounterKeys.list(adventureId),
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => service.deleteEncounter(encounterId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: encounterKeys.list(adventureId),
      });
    },
  });

  // Only the list key is invalidated: the duplicate's detail key holds no cached entry yet — the destination screen's useQuery fetches it on mount.
  const duplicateMutation = useMutation({
    mutationFn: () => service.duplicateEncounter(encounterId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: encounterKeys.list(adventureId),
      });
    },
  });

  const updateEncounter = (data: UpdateEncounterInput) => {
    if (!encounterData) return;

    queryClient.setQueryData<Encounter>(
      encounterKeys.detail(encounterId),
      (old) => {
        if (!old) return old;
        return mergeUpdate(old, data);
      },
    );

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

  const deleteEncounter = async (): Promise<void> => {
    await deleteMutation.mutateAsync();
  };

  const duplicateEncounter = async (): Promise<string> =>
    duplicateMutation.mutateAsync();

  return {
    encounter: encounterData ?? null,
    loading: isLoadingEncounter,
    updateEncounter,
    deleteEncounter,
    duplicateEncounter,
  };
};
