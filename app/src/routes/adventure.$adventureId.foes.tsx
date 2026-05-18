import { createFileRoute } from '@tanstack/react-router';
import { FoesScreen } from '@/screens';

export const Route = createFileRoute(
  '/adventure/$adventureId/foes',
)({
  component: FoesScreen,
});
