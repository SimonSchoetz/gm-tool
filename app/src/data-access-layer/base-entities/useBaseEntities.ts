import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { BaseEntity } from '@db/base-entity';
import type { BaseEntityType } from '@domain/entities';
import * as service from '@services/baseEntityService';
import { baseEntityKeys } from './baseEntityKeys';
import { baseEntityListQueryOptions } from './baseEntityQueryOptions';

type UseBaseEntitiesReturn = {
  baseEntities: BaseEntity[];
  loading: boolean;
  createBaseEntity: () => Promise<string>;
};

export const useBaseEntities = (
  entityType: BaseEntityType,
  adventureId: string,
): UseBaseEntitiesReturn => {
  const queryClient = useQueryClient();

  const { data: baseEntities = [], isPending: isLoadingBaseEntities } =
    useQuery(baseEntityListQueryOptions(entityType, adventureId));

  const createMutation = useMutation({
    mutationFn: () => service.createBaseEntity(entityType, adventureId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: baseEntityKeys.list(entityType, adventureId),
      });
    },
  });

  const createBaseEntity = async (): Promise<string> =>
    createMutation.mutateAsync();

  return {
    baseEntities,
    loading: isLoadingBaseEntities,
    createBaseEntity,
  };
};
