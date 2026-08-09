import { createFileRoute } from '@tanstack/react-router';
import { NpcScreen } from '@/screens';
import { npcQueryOptions, ensureImagePainted } from '@/data-access-layer';

export const Route = createFileRoute('/adventure/$adventureId/npc/$npcId')({
  component: NpcScreen,
  loader: async ({ context, params }) => {
    const npc = await context.queryClient.ensureQueryData(
      npcQueryOptions(params.npcId),
    );
    await ensureImagePainted(context.queryClient, npc.image_id ?? null);
  },
});
