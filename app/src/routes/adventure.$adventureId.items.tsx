import { createFileRoute } from '@tanstack/react-router';
import { BaseEntitiesScreen } from '@/screens';
import {
  baseEntityListQueryOptions,
  tableConfigListQueryOptions,
} from '@/data-access-layer';

export const Route = createFileRoute('/adventure/$adventureId/items')({
  component: () => <BaseEntitiesScreen entityType='items' />,
  loader: async ({ context, params }) => {
    await Promise.all([
      context.queryClient.query({
        ...baseEntityListQueryOptions('items', params.adventureId),
        staleTime: 'static',
      }),
      context.queryClient.query({
        ...tableConfigListQueryOptions(),
        staleTime: 'static',
      }),
    ]);
  },
});
