import { useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Session, UpdateSessionInput } from '@db/session';
import * as service from '@/services/sessionService';
import { sessionKeys } from './sessionKeys';

type UseSessionReturn = {
  session: Session | undefined;
  loading: boolean;
  updateSession: (data: UpdateSessionInput) => void;
  deleteSession: () => Promise<void>;
};

export const useSession = (sessionId: string): UseSessionReturn => {
  const queryClient = useQueryClient();
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingUpdatesRef = useRef<UpdateSessionInput>({});

  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  const { data: session, isPending: loading } = useQuery({
    queryKey: sessionKeys.detail(sessionId),
    queryFn: () => service.getSessionById(sessionId),
    enabled: !!sessionId,
    throwOnError: true,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSessionInput }) =>
      service.updateSession(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sessionKeys.detail(sessionId) });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => service.deleteSession(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sessionKeys.list() });
    },
  });

  const updateSession = (data: UpdateSessionInput) => {
    if (!session) return;

    queryClient.setQueryData<Session>(sessionKeys.detail(sessionId), (old) => {
      if (!old) return old;
      return { ...old, ...data };
    });

    pendingUpdatesRef.current = { ...pendingUpdatesRef.current, ...data };

    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      const updates = { ...pendingUpdatesRef.current };
      pendingUpdatesRef.current = {};
      debounceTimeoutRef.current = null;
      updateMutation.mutate({ id: sessionId, data: updates });
    }, 500);
  };

  const deleteSession = async (): Promise<void> => {
    await deleteMutation.mutateAsync(sessionId);
  };

  return { session, loading, updateSession, deleteSession };
};
