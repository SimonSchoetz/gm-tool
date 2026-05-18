import { createFileRoute } from '@tanstack/react-router';
import { FoeScreen } from '@/screens';

export const Route = createFileRoute(
  '/adventure/$adventureId/foe/$foeId',
)({
  component: FoeScreen,
});
