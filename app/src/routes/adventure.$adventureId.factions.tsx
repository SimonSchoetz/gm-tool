import { createFileRoute } from '@tanstack/react-router';
import { FactionsScreen } from '@/screens';
import {
  factionListQueryOptions,
  tableConfigListQueryOptions,
} from '@/data-access-layer';

export const Route = createFileRoute('/adventure/$adventureId/factions')({
  component: FactionsScreen,
  loader: async ({ context, params }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(
        factionListQueryOptions(params.adventureId),
      ),
      context.queryClient.ensureQueryData(tableConfigListQueryOptions()),
    ]);
  },
});
