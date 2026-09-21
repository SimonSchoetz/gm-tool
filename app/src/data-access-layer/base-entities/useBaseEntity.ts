import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { BaseEntity } from '@db/base-entity';
import type { BaseEntityType } from '@domain/entities';
import * as service from '@services/baseEntityService';
import type { UpdateBaseEntityData } from '@services/baseEntityService';
import { baseEntityKeys } from './baseEntityKeys';
import { baseEntityQueryOptions } from './baseEntityQueryOptions';
import { useAutosaveQueue } from '../useAutosaveQueue';
import { mergeScopedEdit } from '../mergeScopedEdit';
import { mergeUpdate } from '../mergeUpdate';
import { useDuplicateMutation } from '../useDuplicateMutation';

type UseBaseEntityReturn = {
  baseEntity: BaseEntity | null;
  loading: boolean;
  updateBaseEntity: (data: UpdateBaseEntityData) => void;
  deleteBaseEntity: () => Promise<void>;
  duplicateBaseEntity: () => Promise<string>;
  removeBaseEntityImage: () => Promise<void>;
};

export const useBaseEntity = (
  entityType: BaseEntityType,
  baseEntityId: string,
  adventureId: string,
): UseBaseEntityReturn => {
  const queryClient = useQueryClient();

  const { data: baseEntityData, isPending: isLoadingBaseEntity } = useQuery(
    baseEntityQueryOptions(entityType, baseEntityId),
  );

  const updateMutation = useMutation({
    mutationFn: ({
      entityType: scheduledType,
      id,
      data,
    }: {
      entityType: BaseEntityType;
      adventureId: string;
      id: string;
      data: UpdateBaseEntityData;
    }) => service.updateBaseEntity(scheduledType, id, data),
    onSuccess: (
      _result,
      { entityType: scheduledType, adventureId: scheduledAdventureId, id },
    ) => {
      void queryClient.invalidateQueries({
        queryKey: baseEntityKeys.detail(scheduledType, id),
      });
      void queryClient.invalidateQueries({
        queryKey: baseEntityKeys.list(scheduledType, scheduledAdventureId),
      });
    },
  });

  const saveQueue = useAutosaveQueue<{
    entityType: BaseEntityType;
    adventureId: string;
    data: UpdateBaseEntityData;
  }>(
    mergeScopedEdit,
    // `entityType` and `adventureId` travel in the pending edit, taken from the most recent `schedule` for that id, and go through `mutate()` because `entityType` selects the error label and both invalidated keys and `adventureId` selects the invalidated list key.
    (id, pending) => {
      updateMutation.mutate({
        entityType: pending.entityType,
        adventureId: pending.adventureId,
        id,
        data: pending.data,
      });
    },
  );

  const deleteMutation = useMutation({
    mutationFn: () => service.deleteBaseEntity(entityType, baseEntityId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: baseEntityKeys.list(entityType, adventureId),
      });
    },
  });

  const duplicateBaseEntity = useDuplicateMutation(
    () => service.duplicateBaseEntity(entityType, baseEntityId),
    baseEntityKeys.list(entityType, adventureId),
  );

  const removeBaseEntityImageMutation = useMutation({
    mutationFn: () => service.removeBaseEntityImage(entityType, baseEntityId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: baseEntityKeys.detail(entityType, baseEntityId),
      });
      void queryClient.invalidateQueries({
        queryKey: baseEntityKeys.list(entityType, adventureId),
      });
    },
  });

  const updateBaseEntity = (data: UpdateBaseEntityData) => {
    if (!baseEntityData) return;

    queryClient.setQueryData<BaseEntity>(
      baseEntityKeys.detail(entityType, baseEntityId),
      (old) => {
        if (!old) return old;
        const { imgFilePath: _imgFilePath, ...patch } = data;
        return mergeUpdate(old, patch);
      },
    );

    saveQueue.schedule(baseEntityId, { entityType, adventureId, data });
  };

  const deleteBaseEntity = async (): Promise<void> => {
    await deleteMutation.mutateAsync();
  };

  const removeBaseEntityImage = async (): Promise<void> => {
    await removeBaseEntityImageMutation.mutateAsync();
  };

  return {
    baseEntity: baseEntityData ?? null,
    loading: isLoadingBaseEntity,
    updateBaseEntity,
    deleteBaseEntity,
    duplicateBaseEntity,
    removeBaseEntityImage,
  };
};
