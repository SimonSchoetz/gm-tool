import { createFileRoute } from '@tanstack/react-router';
import { LocationScreen } from '@/screens';

export const Route = createFileRoute(
  '/adventure/$adventureId/location/$locationId',
)({
  component: LocationScreen,
});
