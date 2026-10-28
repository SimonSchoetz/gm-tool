import { useQueries } from '@tanstack/react-query';
import type { BaseEntity } from '@db/base-entity';
import { BASE_ENTITY_TYPES } from '@domain/entities';
import { baseEntityListQueryOptions } from './baseEntityQueryOptions';

type UseAdventureBaseEntitiesReturn = {
  baseEntities: BaseEntity[];
  loading: boolean;
};

export const useAdventureBaseEntities = (
  adventureId: string,
): UseAdventureBaseEntitiesReturn => {
  const results = useQueries({
    queries: BASE_ENTITY_TYPES.map((entityType) =>
      baseEntityListQueryOptions(entityType, adventureId),
    ),
  });

  return {
    baseEntities: results.flatMap((result) => result.data ?? []),
    loading: results.some((result) => result.isPending),
  };
};
