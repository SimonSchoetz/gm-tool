import { createFileRoute } from '@tanstack/react-router';
import { ItemsScreen } from '@/screens';
import {
  itemListQueryOptions,
  tableConfigListQueryOptions,
} from '@/data-access-layer';

export const Route = createFileRoute('/adventure/$adventureId/items')({
  component: ItemsScreen,
  loader: async ({ context, params }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(
        itemListQueryOptions(params.adventureId),
      ),
      context.queryClient.ensureQueryData(tableConfigListQueryOptions()),
    ]);
  },
});
