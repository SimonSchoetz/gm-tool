import { createContext, useState, ReactNode, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Npc } from '@db/npc';
import * as service from '@/services/npcsService';
import type { UpdateNpcData } from '@/services/npcsService';

type NpcContextType = {
  npcs: Npc[];
  npc: Npc | null;
  loading: boolean;
  saveError: string | null;
  initNpcs: (adventureId: string) => void;
  initNpc: (id: string) => void;
  updateNpc: (data: UpdateNpcData) => void;
  createNpc: (adventureId: string) => Promise<string>;
  deleteNpc: (id: string) => Promise<void>;
};

export const NpcContext = createContext<NpcContextType | null>(null);

type NpcProviderProps = {
  children: ReactNode;
};

export const NpcProvider = ({ children }: NpcProviderProps) => {
  const queryClient = useQueryClient();
  const [adventureId, setAdventureId] = useState<string | null>(null);
  const [npcId, setNpcId] = useState<string | null>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingUpdatesRef = useRef<UpdateNpcData>({});
  const pendingNpcIdRef = useRef<string | null>(null);

  // Query: Fetch all NPCs for an adventure
  const { data: npcs = [], isPending: isLoadingNpcs } = useQuery({
    queryKey: ['npcs', adventureId],
    queryFn: () => service.getAllNpcs(adventureId!),
    enabled: !!adventureId,
  });

  // Query: Fetch specific NPC
  const { data: npc = null, isPending: isLoadingNpc } = useQuery({
    queryKey: ['npc', npcId],
    queryFn: () => service.getNpcById(npcId!),
    enabled: !!npcId,
    staleTime: 0,
    refetchOnMount: 'always',
  });

  // Mutation: Create NPC
  const createMutation = useMutation({
    mutationFn: (adventureId: string) => service.createNpc(adventureId),
    onSuccess: (_id, adventureId) => {
      queryClient.invalidateQueries({ queryKey: ['npcs', adventureId] });
    },
  });

  // Mutation: Update NPC
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateNpcData }) =>
      service.updateNpc(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['npc', variables.id] });
      // Also invalidate the NPCs list if we have an adventureId
      if (adventureId) {
        queryClient.invalidateQueries({ queryKey: ['npcs', adventureId] });
      }
    },
  });

  // Mutation: Delete NPC
  const deleteMutation = useMutation({
    mutationFn: ({ npcId }: { npcId: string }) => service.deleteNpc(npcId),
    onSuccess: () => {
      if (adventureId) {
        queryClient.invalidateQueries({ queryKey: ['npcs', adventureId] });
      }
      setNpcId(null);
    },
  });

  // Public API
  const initNpcs = useCallback((id: string) => {
    setAdventureId(id);
  }, []);

  const initNpc = useCallback((id: string) => {
    // Clear any pending debounced updates when switching NPCs
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
      debounceTimeoutRef.current = null;
    }

    // Clear accumulated updates
    pendingUpdatesRef.current = {};
    pendingNpcIdRef.current = null;

    setNpcId(id);
  }, []);

  const updateNpc = (data: UpdateNpcData) => {
    if (!npc) return;

    const currentNpcId = npc.id;

    // Immediately update cache for instant UI response
    queryClient.setQueryData<Npc>(['npc', currentNpcId], (old) => {
      if (!old) return old;
      return { ...old, ...data };
    });

    // Accumulate pending updates for this NPC
    if (pendingNpcIdRef.current !== currentNpcId) {
      // New NPC, reset accumulated updates
      pendingUpdatesRef.current = {};
      pendingNpcIdRef.current = currentNpcId;
    }
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
      const idToUpdate = pendingNpcIdRef.current;

      // Clear accumulated updates after sending
      pendingUpdatesRef.current = {};
      pendingNpcIdRef.current = null;

      if (idToUpdate) {
        updateMutation.mutate({ id: idToUpdate, data: updates });
      }
    }, 500);
  };

  const createNpc = async (adventureId: string): Promise<string> => {
    return createMutation.mutateAsync(adventureId);
  };

  const deleteNpc = async (npcId: string): Promise<void> => {
    await deleteMutation.mutateAsync({ npcId });
  };

  const value: NpcContextType = {
    npcs,
    npc,
    loading: isLoadingNpcs || (!!npcId && isLoadingNpc),
    saveError: updateMutation.error?.message ?? null,
    initNpcs,
    initNpc,
    updateNpc,
    createNpc,
    deleteNpc,
  };

  return <NpcContext.Provider value={value}>{children}</NpcContext.Provider>;
};
