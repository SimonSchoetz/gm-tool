import { createFileRoute } from '@tanstack/react-router';
import { BaseEntityScreen } from '@/screens';
import {
  baseEntityQueryOptions,
  ensureImagePainted,
} from '@/data-access-layer';

export const Route = createFileRoute(
  '/adventure/$adventureId/pc/$baseEntityId',
)({
  component: () => <BaseEntityScreen entityType='pcs' />,
  loader: async ({ context, params }) => {
    const baseEntity = await context.queryClient.query({
      ...baseEntityQueryOptions('pcs', params.baseEntityId),
      staleTime: 'static',
    });
    await ensureImagePainted(context.queryClient, baseEntity.image_id);
  },
});
