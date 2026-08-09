import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Session } from '@db/session';
import * as service from '@services/sessionService';
import { sessionKeys } from './sessionKeys';
import { sessionListQueryOptions } from './sessionQueryOptions';

type UseSessionsReturn = {
  sessions: Session[];
  loading: boolean;
  createSession: () => Promise<string>;
  deleteSession: (id: string) => Promise<void>;
};

export const useSessions = (adventureId: string): UseSessionsReturn => {
  const queryClient = useQueryClient();

  const { data: sessions = [], isPending: loading } = useQuery(
    sessionListQueryOptions(adventureId),
  );

  const createMutation = useMutation({
    mutationFn: () => service.createSession(adventureId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: sessionKeys.list(adventureId),
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => service.deleteSession(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: sessionKeys.list(adventureId),
      });
    },
  });

  return {
    sessions,
    loading,
    createSession: () => createMutation.mutateAsync(),
    deleteSession: (id) => deleteMutation.mutateAsync(id),
  };
};
