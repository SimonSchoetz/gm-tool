import {
  useIsMutating,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import type { EncounterQueueItem } from '@db/encounter-queue-item';
import type { BaseEntityType } from '@domain/entities';
import * as service from '@services/encounterQueueService';
import { encounterKeys } from './encounterKeys';
import { encounterQueueItemsQueryOptions } from './encounterQueryOptions';

type UseEncounterQueueItemsReturn = {
  queueItems: EncounterQueueItem[];
  loading: boolean;
  addEntityCombatants: (
    entityType: BaseEntityType,
    baseEntityId: string,
    quantity: number,
  ) => Promise<void>;
  isAdding: boolean;
  reorderQueueItems: (orderedIds: string[]) => void;
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
  ): Promise<void> => {
    if (
      queryClient.isMutating({
        mutationKey: encounterKeys.addCombatants(encounterId),
      }) > 0
    ) {
      return;
    }
    await addMutation.mutateAsync({ entityType, baseEntityId, quantity });
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

  return {
    queueItems,
    loading,
    addEntityCombatants,
    isAdding,
    reorderQueueItems,
  };
};
