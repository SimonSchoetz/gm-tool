import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Session, UpdateSessionInput } from '@db/session';
import * as service from '@services/sessionService';
import { sessionKeys } from './sessionKeys';
import { sessionQueryOptions } from './sessionQueryOptions';
import { createAutosaveQueue } from '../createAutosaveQueue';
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

  const { data: sessionData, isPending: loading } = useQuery(
    sessionQueryOptions(sessionId),
  );

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSessionInput }) =>
      service.updateSession(id, data),
    onSuccess: (_result, { id }) => {
      void queryClient.invalidateQueries({
        queryKey: sessionKeys.detail(id),
      });
      void queryClient.invalidateQueries({
        queryKey: sessionKeys.list(adventureId),
      });
    },
  });

  const [saveQueue] = useState(() =>
    createAutosaveQueue<UpdateSessionInput>(
      (pending, patch) => ({ ...pending, ...patch }),
      (id, data) => {
        updateMutation.mutate({ id, data });
      },
    ),
  );

  useEffect(() => {
    return () => {
      saveQueue.flushAll();
    };
  }, [saveQueue]);

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

    saveQueue.schedule(sessionId, data);
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
