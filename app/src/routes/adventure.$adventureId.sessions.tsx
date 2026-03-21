import { createFileRoute } from '@tanstack/react-router';
import { SessionsScreen } from '@/screens';

export const Route = createFileRoute(
  '/adventure/$adventureId/sessions',
)({
  component: SessionsScreen,
});
