import { createFileRoute } from '@tanstack/react-router';
import { BaseEntitiesScreen } from '@/screens';
import {
  baseEntityListQueryOptions,
  tableConfigListQueryOptions,
} from '@/data-access-layer';

export const Route = createFileRoute('/adventure/$adventureId/locations')({
  component: () => <BaseEntitiesScreen entityType='locations' />,
  loader: async ({ context, params }) => {
    await Promise.all([
      context.queryClient.query({
        ...baseEntityListQueryOptions('locations', params.adventureId),
        staleTime: 'static',
      }),
      context.queryClient.query({
        ...tableConfigListQueryOptions(),
        staleTime: 'static',
      }),
    ]);
  },
});
