import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as pinnedOrderService from '@services/pinnedOrderService';

type UseSetPinnedOrderReturn = {
  pinItem: () => Promise<void>;
  unpinItem: () => Promise<void>;
};

export const useSetPinnedOrder = (
  entityType: string,
  entityId: string,
): UseSetPinnedOrderReturn => {
  const queryClient = useQueryClient();

  const pinMutation = useMutation({
    mutationFn: () => pinnedOrderService.pinEntity(entityType, entityId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [entityType] });
    },
  });

  const unpinMutation = useMutation({
    mutationFn: () => pinnedOrderService.unpinEntity(entityType, entityId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [entityType] });
    },
  });

  return {
    pinItem: () => pinMutation.mutateAsync(),
    unpinItem: () => unpinMutation.mutateAsync(),
  };
};
