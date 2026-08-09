import { useQueryClient } from '@tanstack/react-query';
import { mentionPrefetchByType } from './mentionPrefetchByType';

type UsePrefetchMentionEntityReturn = {
  prefetchMentionEntity: () => void;
};

export const usePrefetchMentionEntity = (
  entityId: string,
  entityType: string,
): UsePrefetchMentionEntityReturn => {
  const queryClient = useQueryClient();

  const prefetchMentionEntity = () => {
    const prefetch = mentionPrefetchByType[entityType];
    if (!prefetch) return;

    void prefetch(queryClient, entityId).catch(() => {
      // swallow: the user may never open the popup, the popup's own hooks surface any real failure to the Error Boundary when it does open, and a speculative fetch must never take down a hover interaction
    });
  };

  return { prefetchMentionEntity };
};
