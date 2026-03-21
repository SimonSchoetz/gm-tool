import { createFileRoute } from '@tanstack/react-router';
import { SessionScreen } from '@/screens';

export const Route = createFileRoute(
  '/adventure/$adventureId/session/$sessionId',
)({
  component: SessionScreen,
});
