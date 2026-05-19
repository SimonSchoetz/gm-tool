import { useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Foe } from '@db/foe';
import * as service from '@services/foesService';
import type { UpdateFoeData } from '@services/foesService';
import { foeKeys } from './foeKeys';
import { mergeUpdate } from '../mergeUpdate';

type UseFoeReturn = {
  foe: Foe | null;
  loading: boolean;
  updateFoe: (data: UpdateFoeData) => void;
  deleteFoe: () => Promise<void>;
  removeFoeImage: () => Promise<void>;
};

export const useFoe = (foeId: string, adventureId: string): UseFoeReturn => {
  const queryClient = useQueryClient();
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingUpdatesRef = useRef<UpdateFoeData>({});

  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  const { data: foeData, isPending: isLoadingFoe } = useQuery({
    queryKey: foeKeys.detail(foeId),
    queryFn: () => service.getFoeById(foeId),
    enabled: !!foeId,
    staleTime: 0,
    refetchOnMount: 'always',
    throwOnError: true,
  });

  const updateMutation = useMutation({
    mutationFn: (data: UpdateFoeData) => service.updateFoe(foeId, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: foeKeys.detail(foeId) });
      void queryClient.invalidateQueries({
        queryKey: foeKeys.list(adventureId),
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => service.deleteFoe(foeId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: foeKeys.list(adventureId),
      });
    },
  });

  const removeFoeImageMutation = useMutation({
    mutationFn: () => service.removeFoeImage(foeId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: foeKeys.detail(foeId) });
      void queryClient.invalidateQueries({
        queryKey: foeKeys.list(adventureId),
      });
    },
  });

  const updateFoe = (data: UpdateFoeData) => {
    if (!foeData) return null;

    queryClient.setQueryData<Foe>(foeKeys.detail(foeId), (old) => {
      if (!old) return old;
      const { imgFilePath: _imgFilePath, ...patch } = data;
      return mergeUpdate(old, patch);
    });

    pendingUpdatesRef.current = {
      ...pendingUpdatesRef.current,
      ...data,
    };

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

  return {
    foe: foeData ?? null,
    loading: isLoadingFoe,
    updateFoe,
    deleteFoe: deleteMutation.mutateAsync,
    removeFoeImage: removeFoeImageMutation.mutateAsync,
  };
};
