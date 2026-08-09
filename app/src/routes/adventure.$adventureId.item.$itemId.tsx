import { createFileRoute } from '@tanstack/react-router';
import { ItemScreen } from '@/screens';
import { itemQueryOptions, ensureImagePainted } from '@/data-access-layer';

export const Route = createFileRoute('/adventure/$adventureId/item/$itemId')({
  component: ItemScreen,
  loader: async ({ context, params }) => {
    const item = await context.queryClient.ensureQueryData(
      itemQueryOptions(params.itemId),
    );
    await ensureImagePainted(context.queryClient, item.image_id ?? null);
  },
});
