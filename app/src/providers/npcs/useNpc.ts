import { useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Npc } from '@db/npc';
import * as service from '@/services/npcsService';
import type { UpdateNpcData } from '@/services/npcsService';

type UseNpcReturn = {
  npc: Npc | undefined;
  loading: boolean;
  saveError: string | null;
  updateNpc: (data: UpdateNpcData) => void;
  deleteNpc: (adventureId: string) => Promise<void>;
};

export const useNpc = (npcId: string): UseNpcReturn => {
  const queryClient = useQueryClient();
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingUpdatesRef = useRef<UpdateNpcData>({});

  // Query: Fetch specific NPC
  const { data: npc, isPending: isLoadingNpc } = useQuery({
    queryKey: ['npc', npcId],
    queryFn: () => service.getNpcById(npcId),
    enabled: !!npcId,
    staleTime: 0,
    refetchOnMount: 'always',
  });

  // Mutation: Update NPC
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateNpcData }) =>
      service.updateNpc(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['npc', variables.id] });
      // Invalidate NPCs list for the adventure
      if (npc?.adventure_id) {
        queryClient.invalidateQueries({ queryKey: ['npcs', npc.adventure_id] });
      }
    },
  });

  // Mutation: Delete NPC
  const deleteMutation = useMutation({
    mutationFn: ({ npcId, adventureId }: { npcId: string; adventureId: string }) =>
      service.deleteNpc(npcId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['npcs', variables.adventureId] });
    },
  });

  // Update function with debouncing
  const updateNpc = (data: UpdateNpcData) => {
    if (!npc) return;

    // Immediately update cache for instant UI response
    queryClient.setQueryData<Npc>(['npc', npcId], (old) => {
      if (!old) return old;
      return { ...old, ...data };
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

      updateMutation.mutate({ id: npcId, data: updates });
    }, 500);
  };

  const deleteNpc = async (adventureId: string): Promise<void> => {
    await deleteMutation.mutateAsync({ npcId, adventureId });
  };

  return {
    npc,
    loading: isLoadingNpc,
    saveError: updateMutation.error?.message ?? null,
    updateNpc,
    deleteNpc,
  };
};
