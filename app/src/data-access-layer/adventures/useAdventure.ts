import { useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Adventure } from '@db/adventure';
import * as service from '@services/adventureService';
import type { UpdateAdventureData } from '@services/adventureService';
import { adventureKeys } from './adventureKeys';
import { adventureQueryOptions } from './adventureQueryOptions';
import { mergeUpdate } from '../mergeUpdate';

type UseAdventureReturn = {
  adventure: Adventure | null;
  loading: boolean;
  updateAdventure: (data: UpdateAdventureData) => void;
  deleteAdventure: () => Promise<void>;
  removeAdventureImage: () => Promise<void>;
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

  const { data: adventureData, isPending: loading } = useQuery(
    adventureQueryOptions(adventureId),
  );

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAdventureData }) =>
      service.updateAdventure(id, data),
    onSuccess: (_result, { id }) => {
      void queryClient.invalidateQueries({ queryKey: adventureKeys.list() });
      void queryClient.invalidateQueries({
        queryKey: adventureKeys.detail(id),
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => service.deleteAdventure(adventureId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adventureKeys.list() });
    },
  });

  const removeAdventureImageMutation = useMutation({
    mutationFn: () => service.removeAdventureImage(adventureId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: adventureKeys.detail(adventureId),
      });
      void queryClient.invalidateQueries({ queryKey: adventureKeys.list() });
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
      debounceTimeoutRef.current = null;

      // Deferred-dispatch mutation carve-out (app/src/CLAUDE.md) — id passed via mutate() call-time variable, not closed over by mutationFn. See .claude/knowledge/tanstack-query.md.
      updateMutation.mutate({ id: adventureId, data: updates });
    }, 500);
  };

  const deleteAdventure = async (): Promise<void> => {
    await deleteMutation.mutateAsync();
  };

  const removeAdventureImage = async (): Promise<void> => {
    await removeAdventureImageMutation.mutateAsync();
  };

  return {
    adventure: adventureData ?? null,
    loading,
    updateAdventure,
    deleteAdventure,
    removeAdventureImage,
  };
};
