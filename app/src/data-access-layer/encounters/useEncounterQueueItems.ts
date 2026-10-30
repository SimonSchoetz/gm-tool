import {
  useIsMutating,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import type {
  EncounterQueueItem,
  UpdateEncounterQueueItemInput,
} from '@db/encounter-queue-item';
import type { BaseEntityType } from '@domain/entities';
import * as service from '@services/encounterQueueService';
import { encounterKeys } from './encounterKeys';
import { encounterQueueItemsQueryOptions } from './encounterQueryOptions';
import { useAutosaveQueue } from '../useAutosaveQueue';
import { mergeScopedEdit } from '../mergeScopedEdit';
import { mergeUpdate } from '../mergeUpdate';

type UseEncounterQueueItemsReturn = {
  queueItems: EncounterQueueItem[];
  loading: boolean;
  addEntityCombatants: (
    entityType: BaseEntityType,
    baseEntityId: string,
    quantity: number,
  ) => Promise<boolean>;
  isAdding: boolean;
  reorderQueueItems: (orderedIds: string[]) => void;
  updateQueueItem: (id: string, data: UpdateEncounterQueueItemInput) => void;
};

export const useEncounterQueueItems = (
  encounterId: string,
): UseEncounterQueueItemsReturn => {
  const queryClient = useQueryClient();

  const { data: queueItems = [], isPending: loading } = useQuery(
    encounterQueueItemsQueryOptions(encounterId),
  );

  const addMutation = useMutation({
    mutationKey: encounterKeys.addCombatants(encounterId),
    mutationFn: ({
      entityType,
      baseEntityId,
      quantity,
    }: {
      entityType: BaseEntityType;
      baseEntityId: string;
      quantity: number;
    }) =>
      service.addEntityCombatants(
        encounterId,
        entityType,
        baseEntityId,
        quantity,
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: encounterKeys.queueItems(encounterId),
      });
    },
  });

  // The pending state is read from the mutation cache, not from addMutation: a hook-local isPending belongs to one hook instance, so the Add rows would not disable each other. The guard in addEntityCombatants reads the cache at call time because a useIsMutating value read from render state lags the call by a render, so two calls in one call stack would both write and hand out the same sort_order and sequence_number.
  const isAdding =
    useIsMutating({ mutationKey: encounterKeys.addCombatants(encounterId) }) >
    0;

  const addEntityCombatants = async (
    entityType: BaseEntityType,
    baseEntityId: string,
    quantity: number,
  ): Promise<boolean> => {
    if (
      queryClient.isMutating({
        mutationKey: encounterKeys.addCombatants(encounterId),
      }) > 0
    ) {
      return false;
    }
    await addMutation.mutateAsync({ entityType, baseEntityId, quantity });
    return true;
  };

  const reorderMutation = useMutation({
    mutationFn: (orderedIds: string[]) => service.reorderQueueItems(orderedIds),
    onError: () => {
      void queryClient.invalidateQueries({
        queryKey: encounterKeys.queueItems(encounterId),
      });
    },
  });

  const reorderQueueItems = (orderedIds: string[]): void => {
    queryClient.setQueryData<EncounterQueueItem[]>(
      encounterKeys.queueItems(encounterId),
      (old) => {
        if (!old) return old;
        const idToItem = new Map(old.map((item) => [item.id, item]));
        return orderedIds
          .map((id, index) => {
            const item = idToItem.get(id) ?? null;
            return item ? { ...item, sort_order: index } : null;
          })
          .filter((item): item is EncounterQueueItem => item !== null);
      },
    );
    reorderMutation.mutate(orderedIds);
  };

  // A successful save invalidates nothing: the cache already holds the edit, and a refetch would overwrite a keystroke typed while the save was in flight. Only a failed save refetches, so the cache returns to the stored value.
  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      encounterId: string;
      data: UpdateEncounterQueueItemInput;
    }) => service.updateQueueItem(id, data),
    onError: (_error, { encounterId: scheduledEncounterId }) => {
      void queryClient.invalidateQueries({
        queryKey: encounterKeys.queueItems(scheduledEncounterId),
      });
    },
  });

  const saveQueue = useAutosaveQueue<{
    encounterId: string;
    data: UpdateEncounterQueueItemInput;
  }>(mergeScopedEdit, (id, { encounterId: scheduledEncounterId, data }) => {
    updateMutation.mutate({ id, encounterId: scheduledEncounterId, data });
  });

  const updateQueueItem = (
    id: string,
    data: UpdateEncounterQueueItemInput,
  ): void => {
    queryClient.setQueryData<EncounterQueueItem[]>(
      encounterKeys.queueItems(encounterId),
      (old) => {
        if (!old) return old;
        return old.map((item) =>
          item.id === id ? mergeUpdate(item, data) : item,
        );
      },
    );

    saveQueue.schedule(id, { encounterId, data });
  };

  return {
    queueItems,
    loading,
    addEntityCombatants,
    isAdding,
    reorderQueueItems,
    updateQueueItem,
  };
};
