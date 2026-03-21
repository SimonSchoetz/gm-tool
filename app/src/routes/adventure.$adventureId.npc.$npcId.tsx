import { createFileRoute } from '@tanstack/react-router';
import { NpcScreen } from '@/screens';

export const Route = createFileRoute(
  '/adventure/$adventureId/npc/$npcId',
)({
  component: NpcScreen,
});
