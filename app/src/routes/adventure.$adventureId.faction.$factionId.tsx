import { createFileRoute } from '@tanstack/react-router';
import { FactionScreen } from '@/screens';
import { factionQueryOptions, ensureImagePainted } from '@/data-access-layer';

export const Route = createFileRoute(
  '/adventure/$adventureId/faction/$factionId',
)({
  component: FactionScreen,
  loader: async ({ context, params }) => {
    const faction = await context.queryClient.ensureQueryData(
      factionQueryOptions(params.factionId),
    );
    await ensureImagePainted(context.queryClient, faction.image_id ?? null);
  },
});
