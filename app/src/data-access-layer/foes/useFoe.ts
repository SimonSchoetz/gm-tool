import { useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Foe } from '@db/foe';
import * as service from '@services/foesService';
import type { UpdateFoeData } from '@services/foesService';
import { foeKeys } from './foeKeys';
import { foeQueryOptions } from './foeQueryOptions';
import { mergeUpdate } from '../mergeUpdate';
import { useDuplicateMutation } from '../useDuplicateMutation';

type UseFoeReturn = {
  foe: Foe | null;
  loading: boolean;
  updateFoe: (data: UpdateFoeData) => void;
  deleteFoe: () => Promise<void>;
  duplicateFoe: () => Promise<string>;
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

  const { data: foeData, isPending: isLoadingFoe } = useQuery(
    foeQueryOptions(foeId),
  );

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateFoeData }) =>
      service.updateFoe(id, data),
    onSuccess: (_result, { id }) => {
      void queryClient.invalidateQueries({ queryKey: foeKeys.detail(id) });
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

  const duplicateFoe = useDuplicateMutation(
    () => service.duplicateFoe(foeId),
    foeKeys.list(adventureId),
  );

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
    if (!foeData) return;

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

      // Deferred-dispatch mutation carve-out (app/src/CLAUDE.md) — id passed via mutate() call-time variable, not closed over by mutationFn. See .claude/knowledge/tanstack-query.md.
      updateMutation.mutate({ id: foeId, data: updates });
    }, 500);
  };

  const deleteFoe = async (): Promise<void> => {
    await deleteMutation.mutateAsync();
  };

  const removeFoeImage = async (): Promise<void> => {
    await removeFoeImageMutation.mutateAsync();
  };

  return {
    foe: foeData ?? null,
    loading: isLoadingFoe,
    updateFoe,
    deleteFoe,
    duplicateFoe,
    removeFoeImage,
  };
};
