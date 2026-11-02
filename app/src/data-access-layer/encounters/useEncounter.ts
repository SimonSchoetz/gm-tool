import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Encounter } from '@db/encounter';
import * as service from '@services/encounterService';
import type { UpdateEncounterData } from '@services/encounterService';
import { encounterKeys } from './encounterKeys';
import { encounterQueryOptions } from './encounterQueryOptions';
import { useAutosaveQueue } from '../useAutosaveQueue';
import { mergeScopedEdit } from '../mergeScopedEdit';
import { mergeUpdate } from '../mergeUpdate';
import { useDuplicateMutation } from '../useDuplicateMutation';

type UseEncounterReturn = {
  encounter: Encounter | null;
  loading: boolean;
  updateEncounter: (data: UpdateEncounterData) => void;
  deleteEncounter: () => Promise<void>;
  duplicateEncounter: () => Promise<string>;
  removeEncounterImage: () => Promise<void>;
};

export const useEncounter = (
  encounterId: string,
  adventureId: string,
): UseEncounterReturn => {
  const queryClient = useQueryClient();

  const { data: encounterData, isPending: isLoadingEncounter } = useQuery(
    encounterQueryOptions(encounterId),
  );

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      adventureId: string;
      data: UpdateEncounterData;
    }) => service.updateEncounter(id, data),
    onSuccess: (_result, { id, adventureId: scheduledAdventureId }) => {
      void queryClient.invalidateQueries({
        queryKey: encounterKeys.detail(id),
      });
      void queryClient.invalidateQueries({
        queryKey: encounterKeys.list(scheduledAdventureId),
      });
    },
  });

  const saveQueue = useAutosaveQueue<{
    adventureId: string;
    data: UpdateEncounterData;
  }>(mergeScopedEdit, (id, { adventureId: scheduledAdventureId, data }) => {
    updateMutation.mutate({ id, adventureId: scheduledAdventureId, data });
  });

  const deleteMutation = useMutation({
    mutationFn: () => service.deleteEncounter(encounterId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: encounterKeys.list(adventureId),
      });
    },
  });

  const duplicateEncounter = useDuplicateMutation(
    () => service.duplicateEncounter(encounterId),
    encounterKeys.list(adventureId),
  );

  const removeEncounterImageMutation = useMutation({
    mutationFn: () => service.removeEncounterImage(encounterId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: encounterKeys.detail(encounterId),
      });
      void queryClient.invalidateQueries({
        queryKey: encounterKeys.list(adventureId),
      });
    },
  });

  const updateEncounter = (data: UpdateEncounterData) => {
    if (!encounterData) return;

    queryClient.setQueryData<Encounter>(
      encounterKeys.detail(encounterId),
      (old) => {
        if (!old) return old;
        const { imgFilePath: _imgFilePath, ...patch } = data;
        return mergeUpdate(old, patch);
      },
    );

    saveQueue.schedule(encounterId, { adventureId, data });
  };

  const deleteEncounter = async (): Promise<void> => {
    await deleteMutation.mutateAsync();
  };

  const removeEncounterImage = async (): Promise<void> => {
    await removeEncounterImageMutation.mutateAsync();
  };

  return {
    encounter: encounterData ?? null,
    loading: isLoadingEncounter,
    updateEncounter,
    deleteEncounter,
    duplicateEncounter,
    removeEncounterImage,
  };
};
