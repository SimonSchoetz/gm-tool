import { createFileRoute } from '@tanstack/react-router';
import { SessionsScreen } from '@/screens';
import { Routes } from './index';

export const Route = createFileRoute(
  `/${Routes.ADVENTURE}/$adventureId/${Routes.SESSIONS}`,
)({
  component: SessionsScreen,
});
