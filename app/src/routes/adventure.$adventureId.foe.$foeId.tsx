import { createFileRoute } from '@tanstack/react-router';
import { FoeScreen } from '@/screens';
import { foeQueryOptions, ensureImagePainted } from '@/data-access-layer';

export const Route = createFileRoute('/adventure/$adventureId/foe/$foeId')({
  component: FoeScreen,
  loader: async ({ context, params }) => {
    const foe = await context.queryClient.ensureQueryData(
      foeQueryOptions(params.foeId),
    );
    await ensureImagePainted(context.queryClient, foe.image_id ?? null);
  },
});
