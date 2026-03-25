import { useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Adventure } from '@db/adventure';
import * as service from '@/services/adventureService';
import type { UpdateAdventureData } from '@/services/adventureService';
import { adventureKeys } from './adventureKeys';
import { mergeUpdate } from '../mergeUpdate';

type UseAdventureReturn = {
  adventure: Adventure | null;
  loading: boolean;
  updateAdventure: (data: UpdateAdventureData) => void;
  deleteAdventure: () => Promise<void>;
};

export const useAdventure = (adventureId: string): UseAdventureReturn => {
  const queryClient = useQueryClient();
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingUpdatesRef = useRef<UpdateAdventureData>({});

  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  const { data: adventureData, isPending: loading } = useQuery({
    queryKey: adventureKeys.detail(adventureId),
    queryFn: () => service.getAdventureById(adventureId),
    enabled: !!adventureId,
    staleTime: 0,
    refetchOnMount: 'always',
    throwOnError: true,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAdventureData }) =>
      service.updateAdventure(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: adventureKeys.list() });
      queryClient.invalidateQueries({ queryKey: adventureKeys.detail(variables.id) });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (adventureId: string) => service.deleteAdventure(adventureId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adventureKeys.list() });
    },
  });

  const updateAdventure = (data: UpdateAdventureData) => {
    if (!adventureData) return;

    queryClient.setQueryData<Adventure>(
      adventureKeys.detail(adventureId),
      (old) => {
        if (!old) return old;
        const { imgFilePath: _imgFilePath, ...patch } = data;
        return mergeUpdate(old, patch);
      },
    );

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

      updateMutation.mutate({ id: adventureId, data: updates });
    }, 500);
  };

  const deleteAdventure = async (): Promise<void> => {
    await deleteMutation.mutateAsync(adventureId);
  };

  return {
    adventure: adventureData ?? null,
    loading,
    updateAdventure,
    deleteAdventure,
  };
};
