import {
  useIsMutating,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import type { EncounterQueueItem } from '@db/encounter-queue-item';
import type { BaseEntityType } from '@domain/entities';
import * as service from '@services/encounterQueueService';
import type { UpdateQueueItemData } from '@services/encounterQueueService';
import { encounterKeys } from './encounterKeys';
import { encounterQueueItemsQueryOptions } from './encounterQueryOptions';
import { useAutosaveQueue } from '../useAutosaveQueue';
import { mergeScopedEdit } from '../mergeScopedEdit';
import { mergeUpdate } from '../mergeUpdate';

type AddQueueItemsVariables =
  | {
      kind: 'entity';
      entityType: BaseEntityType;
      baseEntityId: string;
    }
  | {
      kind: 'random';
      name: string;
      startingMaxHp: number | null;
    }
  | { kind: 'event'; name: string };

type UseEncounterQueueItemsReturn = {
  queueItems: EncounterQueueItem[];
  loading: boolean;
  addEntityCombatants: (
    entityType: BaseEntityType,
    baseEntityId: string,
  ) => Promise<boolean>;
  addRandomCombatants: (
    name: string,
    startingMaxHp: number | null,
  ) => Promise<boolean>;
  addEvent: (name: string) => Promise<boolean>;
  isAdding: boolean;
  reorderQueueItems: (orderedIds: string[]) => void;
  updateQueueItem: (id: string, data: UpdateQueueItemData) => void;
};

export const useEncounterQueueItems = (
  encounterId: string,
): UseEncounterQueueItemsReturn => {
  const queryClient = useQueryClient();

  const { data: queueItems = [], isPending: loading } = useQuery(
    encounterQueueItemsQueryOptions(encounterId),
  );

  // One mutation and one key serve all three adds, so no add runs beside another of the same encounter: two would hand out the same sort_order. A resolved add stays pending until the queue and the log have refetched, so every Add button stays disabled until both show the new rows and the `added` line.
  const addMutation = useMutation({
    mutationKey: encounterKeys.addQueueItems(encounterId),
    mutationFn: (variables: AddQueueItemsVariables) => {
      switch (variables.kind) {
        case 'entity':
          return service.addEntityCombatants(
            encounterId,
            variables.entityType,
            variables.baseEntityId,
          );
        case 'random':
          return service.addRandomCombatants(
            encounterId,
            variables.name,
            variables.startingMaxHp,
          );
        case 'event':
          return service.addEvent(encounterId, variables.name);
      }
    },
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({
          queryKey: encounterKeys.queueItems(encounterId),
        }),
        queryClient.invalidateQueries({
          queryKey: encounterKeys.logEntries(encounterId),
        }),
      ]),
  });

  // The pending state is read from the mutation cache, not from addMutation: a hook-local isPending belongs to one hook instance, so the Add buttons would not disable each other. The guard in add reads the cache at call time because a useIsMutating value read from render state lags the call by a render, so two calls in one call stack, of any of the three adds, would both write and hand out the same sort_order.
  const isAdding =
    useIsMutating({ mutationKey: encounterKeys.addQueueItems(encounterId) }) >
    0;

  const add = async (variables: AddQueueItemsVariables): Promise<boolean> => {
    if (
      queryClient.isMutating({
        mutationKey: encounterKeys.addQueueItems(encounterId),
      }) > 0
    ) {
      return false;
    }
    await addMutation.mutateAsync(variables);
    return true;
  };

  const addEntityCombatants = (
    entityType: BaseEntityType,
    baseEntityId: string,
  ): Promise<boolean> => add({ kind: 'entity', entityType, baseEntityId });

  const addRandomCombatants = (
    name: string,
    startingMaxHp: number | null,
  ): Promise<boolean> => add({ kind: 'random', name, startingMaxHp });

  const addEvent = (name: string): Promise<boolean> =>
    add({ kind: 'event', name });

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
      data: UpdateQueueItemData;
    }) => service.updateQueueItem(id, data),
    onError: (_error, { encounterId: scheduledEncounterId }) => {
      void queryClient.invalidateQueries({
        queryKey: encounterKeys.queueItems(scheduledEncounterId),
      });
    },
  });

  const saveQueue = useAutosaveQueue<{
    encounterId: string;
    data: UpdateQueueItemData;
  }>(mergeScopedEdit, (id, { encounterId: scheduledEncounterId, data }) => {
    updateMutation.mutate({ id, encounterId: scheduledEncounterId, data });
  });

  const updateQueueItem = (id: string, data: UpdateQueueItemData): void => {
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
    addRandomCombatants,
    addEvent,
    isAdding,
    reorderQueueItems,
    updateQueueItem,
  };
};
