import { createFileRoute } from '@tanstack/react-router';
import { LocationsScreen } from '@/screens';

export const Route = createFileRoute('/adventure/$adventureId/locations')({
  component: LocationsScreen,
});
