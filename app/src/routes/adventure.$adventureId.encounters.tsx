import { createFileRoute } from '@tanstack/react-router';
import { EncountersScreen } from '@/screens';
import {
  encounterListQueryOptions,
  tableConfigListQueryOptions,
} from '@/data-access-layer';

export const Route = createFileRoute('/adventure/$adventureId/encounters')({
  component: EncountersScreen,
  loader: async ({ context, params }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(
        encounterListQueryOptions(params.adventureId),
      ),
      context.queryClient.ensureQueryData(tableConfigListQueryOptions()),
    ]);
  },
});
