import { createFileRoute } from '@tanstack/react-router';
import { PcScreen } from '@/screens';
import { pcQueryOptions, ensureImagePainted } from '@/data-access-layer';

export const Route = createFileRoute('/adventure/$adventureId/pc/$pcId')({
  component: PcScreen,
  loader: async ({ context, params }) => {
    const pc = await context.queryClient.ensureQueryData(
      pcQueryOptions(params.pcId),
    );
    await ensureImagePainted(context.queryClient, pc.image_id ?? null);
  },
});
