import { createFileRoute } from '@tanstack/react-router';
import { BaseEntitiesScreen } from '@/screens';
import {
  baseEntityListQueryOptions,
  tableConfigListQueryOptions,
} from '@/data-access-layer';

export const Route = createFileRoute('/adventure/$adventureId/pcs')({
  component: () => <BaseEntitiesScreen entityType='pcs' />,
  loader: async ({ context, params }) => {
    await Promise.all([
      context.queryClient.query({
        ...baseEntityListQueryOptions('pcs', params.adventureId),
        staleTime: 'static',
      }),
      context.queryClient.query({
        ...tableConfigListQueryOptions(),
        staleTime: 'static',
      }),
    ]);
  },
});
