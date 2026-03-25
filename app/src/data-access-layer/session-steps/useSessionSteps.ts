import { useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SessionStep, UpdateSessionStepInput } from '@db/session-step';
import * as service from '@/services/sessionStepService';
import { sessionStepKeys } from './sessionStepKeys';
import { mergeUpdate } from '../mergeUpdate';

type UseSessionStepsReturn = {
  steps: SessionStep[];
  loading: boolean;
  updateStep: (stepId: string, data: UpdateSessionStepInput) => void;
  createStep: (name?: string) => Promise<string>;
  deleteStep: (stepId: string) => Promise<void>;
  reorderSteps: (stepId: string, direction: 'up' | 'down') => void;
  bulkReorder: (orderedStepIds: string[]) => void;
};

type DebounceEntry = {
  timeout?: NodeJS.Timeout;
  pending: UpdateSessionStepInput;
};

export const useSessionSteps = (sessionId: string): UseSessionStepsReturn => {
  const queryClient = useQueryClient();
  const debounceMapRef = useRef<Map<string, DebounceEntry>>(new Map());

  useEffect(() => {
    const map = debounceMapRef.current;
    return () => {
      map.forEach((entry) => clearTimeout(entry.timeout));
    };
  }, []);

  const { data: steps = [], isPending: loading } = useQuery({
    queryKey: sessionStepKeys.list(sessionId),
    queryFn: () => service.getStepsBySessionId(sessionId),
    enabled: !!sessionId,
    throwOnError: true,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSessionStepInput }) =>
      service.updateStep(id, data),
  });

  const createMutation = useMutation({
    mutationFn: (name?: string) => service.createCustomStep(sessionId, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sessionStepKeys.list(sessionId) });
    },
  });

  const bulkReorderMutation = useMutation({
    mutationFn: (orderedStepIds: string[]) =>
      service.bulkReorderSteps(orderedStepIds),
    onError: () => {
      queryClient.invalidateQueries({ queryKey: sessionStepKeys.list(sessionId) });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (stepId: string) => service.deleteStep(stepId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sessionStepKeys.list(sessionId) });
    },
  });

  const updateStep = (stepId: string, data: UpdateSessionStepInput) => {
    queryClient.setQueryData<SessionStep[]>(sessionStepKeys.list(sessionId), (old) => {
      if (!old) return old;
      return old.map((step) => (step.id === stepId ? mergeUpdate(step, data) : step));
    });

    const map = debounceMapRef.current;
    const existing = map.get(stepId);

    if (existing) {
      if (existing.timeout) clearTimeout(existing.timeout);
      existing.pending = { ...existing.pending, ...data };
    } else {
      map.set(stepId, { pending: { ...data } });
    }

    const entry = map.get(stepId)!;
    entry.timeout = setTimeout(() => {
      const accumulated = { ...entry.pending };
      map.delete(stepId);
      updateMutation.mutate({ id: stepId, data: accumulated });
    }, 500);
  };

  const createStep = async (name?: string): Promise<string> =>
    createMutation.mutateAsync(name);

  const deleteStep = async (stepId: string): Promise<void> => {
    await deleteMutation.mutateAsync(stepId);
  };

  const reorderSteps = (stepId: string, direction: 'up' | 'down'): void => {
    queryClient.setQueryData<SessionStep[]>(sessionStepKeys.list(sessionId), (old) => {
      if (!old) return old;
      const index = old.findIndex((s) => s.id === stepId);
      if (index === -1) return old;
      const adjacentIndex = direction === 'up' ? index - 1 : index + 1;
      const adjacent = old[adjacentIndex];
      if (!adjacent) return old;
      const targetSortOrder = old[index].sort_order;
      const updated = old.map((s) => {
        if (s.id === stepId) return { ...s, sort_order: adjacent.sort_order };
        if (s.id === adjacent.id) return { ...s, sort_order: targetSortOrder };
        return s;
      });
      return [...updated].sort((a, b) => a.sort_order - b.sort_order);
    });

    service.swapStepOrder(sessionId, stepId, direction).catch(() => {
      queryClient.invalidateQueries({ queryKey: sessionStepKeys.list(sessionId) });
    });
  };

  const bulkReorder = (orderedStepIds: string[]): void => {
    queryClient.setQueryData<SessionStep[]>(sessionStepKeys.list(sessionId), (old) => {
      if (!old) return old;
      const idToStep = new Map(old.map((s) => [s.id, s]));
      return orderedStepIds
        .map((id, index) => {
          const step = idToStep.get(id);
          return step ? { ...step, sort_order: index } : null;
        })
        .filter((s): s is SessionStep => s !== null);
    });
    bulkReorderMutation.mutate(orderedStepIds);
  };

  return { steps, loading, updateStep, createStep, deleteStep, reorderSteps, bulkReorder };
};
