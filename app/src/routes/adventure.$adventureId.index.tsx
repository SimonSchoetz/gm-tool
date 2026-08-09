import { createFileRoute } from '@tanstack/react-router';
import { AdventureScreen } from '@/screens';
import { adventureQueryOptions, ensureImagePainted } from '@/data-access-layer';

export const Route = createFileRoute('/adventure/$adventureId/')({
  component: AdventureScreen,
  loader: async ({ context, params }) => {
    const adventure = await context.queryClient.ensureQueryData(
      adventureQueryOptions(params.adventureId),
    );
    await ensureImagePainted(context.queryClient, adventure.image_id ?? null);
  },
});
