import { createFileRoute } from '@tanstack/react-router';
import { BaseEntityScreen } from '@/screens';
import {
  baseEntityQueryOptions,
  ensureImagePainted,
} from '@/data-access-layer';

export const Route = createFileRoute(
  '/adventure/$adventureId/npc/$baseEntityId',
)({
  component: () => <BaseEntityScreen entityType='npcs' />,
  loader: async ({ context, params }) => {
    const baseEntity = await context.queryClient.ensureQueryData(
      baseEntityQueryOptions('npcs', params.baseEntityId),
    );
    await ensureImagePainted(context.queryClient, baseEntity.image_id);
  },
});
