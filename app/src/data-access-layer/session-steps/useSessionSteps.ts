import { useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SessionStep, UpdateSessionStepInput } from '@db/session-step';
import * as service from '@/services/sessionStepService';
import { sessionStepKeys } from './sessionStepKeys';

type UseSessionStepsReturn = {
  steps: SessionStep[];
  loading: boolean;
  updateStep: (stepId: string, data: UpdateSessionStepInput) => void;
  createStep: (name?: string) => Promise<string>;
  deleteStep: (stepId: string) => Promise<void>;
  reorderSteps: (stepId: string, direction: 'up' | 'down') => void;
};

type DebounceEntry = {
  timeout: NodeJS.Timeout;
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

  const deleteMutation = useMutation({
    mutationFn: (stepId: string) => service.deleteStep(stepId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sessionStepKeys.list(sessionId) });
    },
  });

  const updateStep = (stepId: string, data: UpdateSessionStepInput) => {
    queryClient.setQueryData<SessionStep[]>(sessionStepKeys.list(sessionId), (old) => {
      if (!old) return old;
      return old.map((step) => (step.id === stepId ? { ...step, ...data } : step));
    });

    const map = debounceMapRef.current;
    const existing = map.get(stepId);

    if (existing) {
      clearTimeout(existing.timeout);
      existing.pending = { ...existing.pending, ...data };
    } else {
      map.set(stepId, { timeout: 0 as unknown as NodeJS.Timeout, pending: { ...data } });
    }

    const entry = map.get(stepId)!;
    entry.timeout = setTimeout(() => {
      const accumulated = { ...entry.pending };
      map.delete(stepId);
      updateMutation.mutate({ id: stepId, data: accumulated });
    }, 500);
  };

  // Implemented in sub-feature 11
  const createStep = async (_name?: string): Promise<string> => {
    throw new Error('createStep not yet implemented — see sub-feature 11');
  };

  const deleteStep = async (stepId: string): Promise<void> => {
    await deleteMutation.mutateAsync(stepId);
  };

  // Implemented in sub-feature 9
  const reorderSteps = (_stepId: string, _direction: 'up' | 'down'): void => {
    throw new Error('reorderSteps not yet implemented — see sub-feature 9');
  };

  return { steps, loading, updateStep, createStep, deleteStep, reorderSteps };
};
