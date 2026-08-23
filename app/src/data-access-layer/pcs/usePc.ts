import { useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Pc } from '@db/pc';
import * as service from '@services/pcsService';
import type { UpdatePcData } from '@services/pcsService';
import { pcKeys } from './pcKeys';
import { pcQueryOptions } from './pcQueryOptions';
import { mergeUpdate } from '../mergeUpdate';
import { useDuplicateMutation } from '../useDuplicateMutation';

type UsePcReturn = {
  pc: Pc | null;
  loading: boolean;
  updatePc: (data: UpdatePcData) => void;
  deletePc: () => Promise<void>;
  duplicatePc: () => Promise<string>;
  removePcImage: () => Promise<void>;
};

export const usePc = (pcId: string, adventureId: string): UsePcReturn => {
  const queryClient = useQueryClient();
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingUpdatesRef = useRef<UpdatePcData>({});

  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  const { data: pcData, isPending: isLoadingPc } = useQuery(
    pcQueryOptions(pcId),
  );

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePcData }) =>
      service.updatePc(id, data),
    onSuccess: (_result, { id }) => {
      void queryClient.invalidateQueries({ queryKey: pcKeys.detail(id) });
      void queryClient.invalidateQueries({
        queryKey: pcKeys.list(adventureId),
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => service.deletePc(pcId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: pcKeys.list(adventureId),
      });
    },
  });

  const duplicatePc = useDuplicateMutation(
    () => service.duplicatePc(pcId),
    pcKeys.list(adventureId),
  );

  const removePcImageMutation = useMutation({
    mutationFn: () => service.removePcImage(pcId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: pcKeys.detail(pcId) });
      void queryClient.invalidateQueries({
        queryKey: pcKeys.list(adventureId),
      });
    },
  });

  const updatePc = (data: UpdatePcData) => {
    if (!pcData) return;

    queryClient.setQueryData<Pc>(pcKeys.detail(pcId), (old) => {
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
      updateMutation.mutate({ id: pcId, data: updates });
    }, 500);
  };

  const deletePc = async (): Promise<void> => {
    await deleteMutation.mutateAsync();
  };

  const removePcImage = async (): Promise<void> => {
    await removePcImageMutation.mutateAsync();
  };

  return {
    pc: pcData ?? null,
    loading: isLoadingPc,
    updatePc,
    deletePc,
    duplicatePc,
    removePcImage,
  };
};
