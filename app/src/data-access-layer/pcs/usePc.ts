import { useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Pc } from '@db/pc';
import * as service from '@services/pcsService';
import type { UpdatePcData } from '@services/pcsService';
import { pcKeys } from './pcKeys';
import { mergeUpdate } from '../mergeUpdate';

type UsePcReturn = {
  pc: Pc | null;
  loading: boolean;
  updatePc: (data: UpdatePcData) => void;
  deletePc: () => Promise<void>;
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

  const { data: pcData, isPending: isLoadingPc } = useQuery({
    queryKey: pcKeys.detail(pcId),
    queryFn: () => service.getPcById(pcId),
    enabled: !!pcId,
    staleTime: 0,
    refetchOnMount: 'always',
    throwOnError: true,
  });

  const updateMutation = useMutation({
    mutationFn: (data: UpdatePcData) => service.updatePc(pcId, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: pcKeys.detail(pcId) });
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

      updateMutation.mutate(updates);
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
    removePcImage,
  };
};
