import { createFileRoute } from '@tanstack/react-router';
import { NpcsScreen } from '@/screens';
import { Routes } from './index';

export const Route = createFileRoute(
  `/${Routes.ADVENTURE}/$adventureId/${Routes.NPCS}`,
)({
  component: NpcsScreen,
});
