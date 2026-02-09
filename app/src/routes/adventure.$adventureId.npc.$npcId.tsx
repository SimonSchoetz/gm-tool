import { createFileRoute } from '@tanstack/react-router';
import { NpcScreen } from '@/screens';
import { Routes } from './index';

export const Route = createFileRoute(
  `/${Routes.ADVENTURE}/$adventureId/${Routes.NPC}/$npcId`,
)({
  component: NpcScreen,
});
