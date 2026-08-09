import { createFileRoute } from '@tanstack/react-router';
import { EncounterScreen } from '@/screens';
import { encounterQueryOptions } from '@/data-access-layer';

export const Route = createFileRoute(
  '/adventure/$adventureId/encounter/$encounterId',
)({
  component: EncounterScreen,
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(
      encounterQueryOptions(params.encounterId),
    ),
});
