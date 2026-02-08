import { createContext, useState, ReactNode, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Adventure } from '@db/adventure';
import * as service from '@/services/adventureService';
import type { UpdateAdventureData } from '@/services/adventureService';

type AdventureContextType = {
  adventures: Adventure[];
  adventure: Adventure | null;
  loading: boolean;
  saveError: string | null;
  initAdventure: (id: string) => void;
  updateAdventure: (data: UpdateAdventureData) => void;
  createAdventure: () => Promise<string>;
  deleteAdventure: (id: string) => Promise<void>;
};

export const AdventureContext = createContext<AdventureContextType | null>(
  null,
);

type AdventureProviderProps = {
  children: ReactNode;
};

export const AdventureProvider = ({ children }: AdventureProviderProps) => {
  const queryClient = useQueryClient();
  const [adventureId, setAdventureId] = useState<string | null>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingUpdatesRef = useRef<UpdateAdventureData>({});
  const pendingAdventureIdRef = useRef<string | null>(null);

  // Query: Fetch all adventures
  const { data: adventures = [], isPending: isLoadingAdventures } = useQuery({
    queryKey: ['adventures'],
    queryFn: service.getAllAdventures,
  });

  // Query: Fetch specific adventure
  const { data: adventure = null, isPending: isLoadingAdventure } = useQuery({
    queryKey: ['adventure', adventureId],
    queryFn: () => service.getAdventureById(adventureId!),
    enabled: !!adventureId,
    staleTime: 0, // Data is always stale
    refetchOnMount: 'always', // Always refetch on mount to get fresh data
  });

  // Mutation: Create adventure
  const createMutation = useMutation({
    mutationFn: service.createAdventure,
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ['adventures'] });
      return id;
    },
  });

  // Mutation: Update adventure
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAdventureData }) =>
      service.updateAdventure(id, data),
    onSuccess: (_data, variables) => {
      // Refetch to sync with server after successful save
      queryClient.invalidateQueries({ queryKey: ['adventures'] });
      queryClient.invalidateQueries({ queryKey: ['adventure', variables.id] });
    },
  });

  // Mutation: Delete adventure
  const deleteMutation = useMutation({
    mutationFn: ({ adventureId }: { adventureId: string }) =>
      service.deleteAdventure(adventureId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adventures'] });
      setAdventureId(null);
    },
  });

  // Public API
  const initAdventure = useCallback((id: string) => {
    // Clear any pending debounced updates when switching adventures
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
      debounceTimeoutRef.current = null;
    }

    // Clear accumulated updates
    pendingUpdatesRef.current = {};
    pendingAdventureIdRef.current = null;

    setAdventureId(id);
  }, []);

  const updateAdventure = (data: UpdateAdventureData) => {
    if (!adventure) return;

    const currentAdventureId = adventure.id;

    // Immediately update cache for instant UI response
    queryClient.setQueryData<Adventure>(
      ['adventure', currentAdventureId],
      (old) => {
        if (!old) return old;
        return { ...old, ...data };
      },
    );

    // Accumulate pending updates for this adventure
    if (pendingAdventureIdRef.current !== currentAdventureId) {
      // New adventure, reset accumulated updates
      pendingUpdatesRef.current = {};
      pendingAdventureIdRef.current = currentAdventureId;
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
      const idToUpdate = pendingAdventureIdRef.current;

      // Clear accumulated updates after sending
      pendingUpdatesRef.current = {};
      pendingAdventureIdRef.current = null;

      if (idToUpdate) {
        updateMutation.mutate({ id: idToUpdate, data: updates });
      }
    }, 500);
  };

  const createAdventure = async (): Promise<string> => {
    return createMutation.mutateAsync();
  };

  const deleteAdventure = async (adventureId: string): Promise<void> => {
    await deleteMutation.mutateAsync({ adventureId });
  };

  const value: AdventureContextType = {
    adventures,
    adventure,
    loading: isLoadingAdventures || (!!adventureId && isLoadingAdventure),
    saveError: updateMutation.error?.message ?? null,
    initAdventure,
    updateAdventure,
    createAdventure,
    deleteAdventure,
  };

  return (
    <AdventureContext.Provider value={value}>
      {children}
    </AdventureContext.Provider>
  );
};
