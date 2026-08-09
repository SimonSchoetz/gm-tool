import { createFileRoute } from '@tanstack/react-router';
import { LocationScreen } from '@/screens';
import { locationQueryOptions, ensureImagePainted } from '@/data-access-layer';

export const Route = createFileRoute(
  '/adventure/$adventureId/location/$locationId',
)({
  component: LocationScreen,
  loader: async ({ context, params }) => {
    const location = await context.queryClient.ensureQueryData(
      locationQueryOptions(params.locationId),
    );
    await ensureImagePainted(context.queryClient, location.image_id ?? null);
  },
});
