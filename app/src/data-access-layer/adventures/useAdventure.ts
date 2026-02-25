import { useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Adventure } from '@db/adventure';
import * as service from '@/services/adventureService';
import type { UpdateAdventureData } from '@/services/adventureService';

type UseAdventureReturn = {
  adventure: Adventure | undefined;
  loading: boolean;
  saveError: string | null;
  updateAdventure: (data: UpdateAdventureData) => void;
  deleteAdventure: () => Promise<void>;
};

export const useAdventure = (adventureId: string): UseAdventureReturn => {
  const queryClient = useQueryClient();
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingUpdatesRef = useRef<UpdateAdventureData>({});

  // Query: Fetch specific adventure
  const { data: adventure, isPending: isLoadingAdventure } = useQuery({
    queryKey: ['adventure', adventureId],
    queryFn: () => service.getAdventureById(adventureId),
    enabled: !!adventureId,
    staleTime: 0,
    refetchOnMount: 'always',
  });

  // Mutation: Update adventure
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAdventureData }) =>
      service.updateAdventure(id, data),
    onSuccess: (_data, variables) => {
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
    },
  });

  // Update function with debouncing
  const updateAdventure = (data: UpdateAdventureData) => {
    if (!adventure) return;

    // Immediately update cache for instant UI response
    queryClient.setQueryData<Adventure>(
      ['adventure', adventureId],
      (old) => {
        if (!old) return old;
        return { ...old, ...data };
      },
    );

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

      updateMutation.mutate({ id: adventureId, data: updates });
    }, 500);
  };

  const deleteAdventure = async (): Promise<void> => {
    await deleteMutation.mutateAsync({ adventureId });
  };

  return {
    adventure,
    loading: isLoadingAdventure,
    saveError: updateMutation.error?.message ?? null,
    updateAdventure,
    deleteAdventure,
  };
};
