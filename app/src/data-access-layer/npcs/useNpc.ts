import { useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Npc } from '@db/npc';
import * as service from '@/services/npcsService';
import type { UpdateNpcData } from '@/services/npcsService';
import { npcKeys } from './npcKeys';
import { mergeUpdate } from '../mergeUpdate';

export type UseNpcReturn = {
  npc: Npc | null;
  loading: boolean;
  updateNpc: (data: UpdateNpcData) => void;
  deleteNpc: (adventureId: string) => Promise<void>;
};

export const useNpc = (npcId: string): UseNpcReturn => {
  const queryClient = useQueryClient();
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingUpdatesRef = useRef<UpdateNpcData>({});

  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  const { data: npcData, isPending: isLoadingNpc } = useQuery({
    queryKey: npcKeys.detail(npcId),
    queryFn: () => service.getNpcById(npcId),
    enabled: !!npcId,
    staleTime: 0,
    refetchOnMount: 'always',
    throwOnError: true,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateNpcData }) =>
      service.updateNpc(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: npcKeys.detail(variables.id) });
      if (npcData?.adventure_id) {
        queryClient.invalidateQueries({ queryKey: npcKeys.list(npcData.adventure_id) });
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: ({ npcId }: { npcId: string; adventureId: string }) =>
      service.deleteNpc(npcId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: npcKeys.list(variables.adventureId) });
    },
  });

  const updateNpc = (data: UpdateNpcData) => {
    if (!npcData) return;

    // Optimistic cache update for instant UI response
    queryClient.setQueryData<Npc>(npcKeys.detail(npcId), (old) => {
      if (!old) return old;
      const { imgFilePath: _imgFilePath, ...patch } = data;
      return mergeUpdate(old, patch);
    });

    // Accumulate pending updates
    pendingUpdatesRef.current = {
      ...pendingUpdatesRef.current,
      ...data,
    };

    // Clear previous debounce timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Debounce DB save (500ms after last change)
    debounceTimeoutRef.current = setTimeout(() => {
      const updates = { ...pendingUpdatesRef.current };
      pendingUpdatesRef.current = {};
      debounceTimeoutRef.current = null;

      updateMutation.mutate({ id: npcId, data: updates });
    }, 500);
  };

  const deleteNpc = async (adventureId: string): Promise<void> => {
    await deleteMutation.mutateAsync({ npcId, adventureId });
  };

  return {
    npc: npcData ?? null,
    loading: isLoadingNpc,
    updateNpc,
    deleteNpc,
  };
};
