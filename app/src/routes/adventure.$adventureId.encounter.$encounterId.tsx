import { createFileRoute } from '@tanstack/react-router';
import { EncounterScreen } from '@/screens';
import { encounterQueryOptions, ensureImagePainted } from '@/data-access-layer';

export const Route = createFileRoute(
  '/adventure/$adventureId/encounter/$encounterId',
)({
  component: EncounterScreen,
  loader: async ({ context, params }) => {
    const encounter = await context.queryClient.query({
      ...encounterQueryOptions(params.encounterId),
      staleTime: 'static',
    });
    await ensureImagePainted(context.queryClient, encounter.image_id);
  },
});
