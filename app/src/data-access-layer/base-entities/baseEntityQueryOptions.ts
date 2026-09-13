import { queryOptions } from '@tanstack/react-query';
import type { BaseEntityType } from '@domain/entities';
import * as service from '@services/baseEntityService';
import { baseEntityKeys } from './baseEntityKeys';

export const baseEntityListQueryOptions = (
  entityType: BaseEntityType,
  adventureId: string,
) =>
  queryOptions({
    queryKey: baseEntityKeys.list(entityType, adventureId),
    queryFn: () => service.getAllBaseEntities(entityType, adventureId),
    enabled: !!adventureId,
    throwOnError: true,
  });

export const baseEntityQueryOptions = (
  entityType: BaseEntityType,
  baseEntityId: string,
) =>
  queryOptions({
    queryKey: baseEntityKeys.detail(entityType, baseEntityId),
    queryFn: () => service.getBaseEntityById(entityType, baseEntityId),
    enabled: !!baseEntityId,
    staleTime: 0,
    refetchOnMount: 'always',
    throwOnError: true,
  });
