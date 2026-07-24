import { useQuery } from '@tanstack/react-query';
import * as service from '@services/mentionSearchService';
import { mentionEntityKeys } from './mentionEntityKeys';

type UseMentionEntityDataReturn = {
  name: string | null;
  deleted: boolean;
  loading: boolean;
};

export const useMentionEntityData = (
  entityId: string,
  entityType: string,
): UseMentionEntityDataReturn => {
  const { data, isPending: loading } = useQuery({
    queryKey: mentionEntityKeys.detail(entityType, entityId),
    queryFn: () => service.getMentionEntityData(entityType, entityId),
    enabled: !!entityId,
    staleTime: 0,
    refetchOnMount: 'always',
    throwOnError: true,
  });

  return {
    name: data?.name ?? null,
    deleted: data?.deleted ?? false,
    loading,
  };
};
