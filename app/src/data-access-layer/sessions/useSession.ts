import { useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Session, UpdateSessionInput } from '@db/session';
import * as service from '@services/sessionService';
import { sessionKeys } from './sessionKeys';
import { sessionQueryOptions } from './sessionQueryOptions';
import { mergeUpdate } from '../mergeUpdate';
import { useDuplicateMutation } from '../useDuplicateMutation';

type UseSessionReturn = {
  session: Session | null;
  loading: boolean;
  updateSession: (data: UpdateSessionInput) => void;
  deleteSession: () => Promise<void>;
  duplicateSession: () => Promise<string>;
};

export const useSession = (
  sessionId: string,
  adventureId: string,
): UseSessionReturn => {
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

  const { data: sessionData, isPending: loading } = useQuery(
    sessionQueryOptions(sessionId),
  );

  const updateMutation = useMutation({
    mutationFn: (data: UpdateSessionInput) =>
      service.updateSession(sessionId, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: sessionKeys.detail(sessionId),
      });
      void queryClient.invalidateQueries({
        queryKey: sessionKeys.list(adventureId),
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => service.deleteSession(sessionId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: sessionKeys.list(adventureId),
      });
    },
  });

  const duplicateSession = useDuplicateMutation(
    () => service.duplicateSession(sessionId),
    sessionKeys.list(adventureId),
  );

  const updateSession = (data: UpdateSessionInput) => {
    if (!sessionData) return;

    queryClient.setQueryData<Session>(sessionKeys.detail(sessionId), (old) => {
      if (!old) return old;
      return mergeUpdate(old, data);
    });

    queryClient.setQueryData<Session[]>(
      sessionKeys.list(adventureId),
      (old) => {
        if (!old) return old;
        return old.map((s) => (s.id === sessionId ? mergeUpdate(s, data) : s));
      },
    );

    pendingUpdatesRef.current = { ...pendingUpdatesRef.current, ...data };

    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      const updates = { ...pendingUpdatesRef.current };
      pendingUpdatesRef.current = {};
      debounceTimeoutRef.current = null;
      updateMutation.mutate(updates);
    }, 500);
  };

  const deleteSession = async (): Promise<void> => {
    await deleteMutation.mutateAsync();
  };

  return {
    session: sessionData ?? null,
    loading,
    updateSession,
    deleteSession,
    duplicateSession,
  };
};
