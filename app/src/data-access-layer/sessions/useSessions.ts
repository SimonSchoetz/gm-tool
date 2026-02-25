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

export const useSessions = (): UseSessionsReturn => {
  const queryClient = useQueryClient();

  const { data: sessions = [], isPending: loading } = useQuery({
    queryKey: sessionKeys.list(),
    queryFn: service.getAllSessions,
    throwOnError: true,
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateSessionInput) => service.createSession(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sessionKeys.list() });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => service.deleteSession(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sessionKeys.list() });
    },
  });

  return {
    sessions,
    loading,
    createSession: (data) => createMutation.mutateAsync(data),
    deleteSession: (id) => deleteMutation.mutateAsync(id),
  };
};
