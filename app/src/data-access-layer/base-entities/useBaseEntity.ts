import { useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { BaseEntity } from '@db/base-entity';
import type { BaseEntityType } from '@domain/entities';
import * as service from '@services/baseEntityService';
import type { UpdateBaseEntityData } from '@services/baseEntityService';
import { baseEntityKeys } from './baseEntityKeys';
import { baseEntityQueryOptions } from './baseEntityQueryOptions';
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
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingUpdatesRef = useRef<UpdateBaseEntityData>({});

  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

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
      id: string;
      data: UpdateBaseEntityData;
    }) => service.updateBaseEntity(scheduledType, id, data),
    onSuccess: (_result, { entityType: scheduledType, id }) => {
      void queryClient.invalidateQueries({
        queryKey: baseEntityKeys.detail(scheduledType, id),
      });
      void queryClient.invalidateQueries({
        queryKey: baseEntityKeys.list(scheduledType, adventureId),
      });
    },
  });

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

      // Deferred-dispatch mutation carve-out (.claude/rules/src-data-access-layer.md) — entityType and id passed via mutate() call-time variables, not closed over by mutationFn: a scheduled write must target the entity being edited when the debounce started, and the entity type is part of that target (it selects the error label and both invalidated keys). See .claude/knowledge/tanstack-query.md.
      updateMutation.mutate({ entityType, id: baseEntityId, data: updates });
    }, 500);
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
