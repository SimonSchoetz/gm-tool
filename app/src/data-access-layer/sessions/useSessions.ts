import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Session, CreateSessionInput } from '@db/session';
import * as service from '@/services/sessionService';
import { sessionKeys } from './sessionKeys';

type UseSessionsReturn = {
  sessions: Session[];
  loading: boolean;
  createSession: (data: CreateSessionInput) => Promise<string>;
  deleteSession: (id: string) => Promise<void>;
};

export const useSessions = (adventureId: string): UseSessionsReturn => {
  const queryClient = useQueryClient();

  const { data: sessions = [], isPending: loading } = useQuery({
    queryKey: sessionKeys.list(adventureId),
    queryFn: () => service.getAllSessions(adventureId),
    enabled: !!adventureId,
    throwOnError: true,
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateSessionInput) => service.createSession(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: sessionKeys.list(adventureId) });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => service.deleteSession(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: sessionKeys.list(adventureId) });
    },
  });

  return {
    sessions,
    loading,
    createSession: (data) => createMutation.mutateAsync(data),
    deleteSession: (id) => deleteMutation.mutateAsync(id),
  };
};
