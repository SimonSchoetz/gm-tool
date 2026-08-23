import { useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Item } from '@db/item';
import * as service from '@services/itemsService';
import type { UpdateItemData } from '@services/itemsService';
import { itemKeys } from './itemKeys';
import { itemQueryOptions } from './itemQueryOptions';
import { mergeUpdate } from '../mergeUpdate';
import { useDuplicateMutation } from '../useDuplicateMutation';

type UseItemReturn = {
  item: Item | null;
  loading: boolean;
  updateItem: (data: UpdateItemData) => void;
  deleteItem: () => Promise<void>;
  duplicateItem: () => Promise<string>;
  removeItemImage: () => Promise<void>;
};

export const useItem = (itemId: string, adventureId: string): UseItemReturn => {
  const queryClient = useQueryClient();
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingUpdatesRef = useRef<UpdateItemData>({});

  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  const { data: itemData, isPending: isLoadingItem } = useQuery(
    itemQueryOptions(itemId),
  );

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateItemData }) =>
      service.updateItem(id, data),
    onSuccess: (_result, { id }) => {
      void queryClient.invalidateQueries({ queryKey: itemKeys.detail(id) });
      void queryClient.invalidateQueries({
        queryKey: itemKeys.list(adventureId),
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => service.deleteItem(itemId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: itemKeys.list(adventureId),
      });
    },
  });

  const duplicateItem = useDuplicateMutation(
    () => service.duplicateItem(itemId),
    itemKeys.list(adventureId),
  );

  const removeItemImageMutation = useMutation({
    mutationFn: () => service.removeItemImage(itemId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: itemKeys.detail(itemId) });
      void queryClient.invalidateQueries({
        queryKey: itemKeys.list(adventureId),
      });
    },
  });

  const updateItem = (data: UpdateItemData) => {
    if (!itemData) return;

    queryClient.setQueryData<Item>(itemKeys.detail(itemId), (old) => {
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
      updateMutation.mutate({ id: itemId, data: updates });
    }, 500);
  };

  const deleteItem = async (): Promise<void> => {
    await deleteMutation.mutateAsync();
  };

  const removeItemImage = async (): Promise<void> => {
    await removeItemImageMutation.mutateAsync();
  };

  return {
    item: itemData ?? null,
    loading: isLoadingItem,
    updateItem,
    deleteItem,
    duplicateItem,
    removeItemImage,
  };
};
