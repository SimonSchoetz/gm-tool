import { useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Item } from '@db/item';
import * as service from '@services/itemsService';
import type { UpdateItemData } from '@services/itemsService';
import { itemKeys } from './itemKeys';
import { mergeUpdate } from '../mergeUpdate';

type UseItemReturn = {
  item: Item | null;
  loading: boolean;
  updateItem: (data: UpdateItemData) => void;
  deleteItem: () => Promise<void>;
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

  const { data: itemData, isPending: isLoadingItem } = useQuery({
    queryKey: itemKeys.detail(itemId),
    queryFn: () => service.getItemById(itemId),
    enabled: !!itemId,
    staleTime: 0,
    refetchOnMount: 'always',
    throwOnError: true,
  });

  const updateMutation = useMutation({
    mutationFn: (data: UpdateItemData) => service.updateItem(itemId, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: itemKeys.detail(itemId) });
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
    if (!itemData) return null;

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

      updateMutation.mutate(updates);
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
    removeItemImage,
  };
};
