import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Item } from '@db/item';
import * as service from '@services/itemsService';
import { itemKeys } from './itemKeys';

type UseItemsReturn = {
  items: Item[];
  loading: boolean;
  createItem: () => Promise<string>;
};

export const useItems = (adventureId: string): UseItemsReturn => {
  const queryClient = useQueryClient();

  const { data: items = [], isPending: isLoadingItems } = useQuery({
    queryKey: itemKeys.list(adventureId),
    queryFn: () => service.getAllItems(adventureId),
    enabled: !!adventureId,
    throwOnError: true,
  });

  const createMutation = useMutation({
    mutationFn: () => service.createItem(adventureId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: itemKeys.list(adventureId),
      });
    },
  });

  const createItem = async (): Promise<string> => createMutation.mutateAsync();

  return {
    items,
    loading: isLoadingItems,
    createItem,
  };
};
