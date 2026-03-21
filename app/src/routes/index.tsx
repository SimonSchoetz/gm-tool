import { createFileRoute, redirect } from '@tanstack/react-router';

export const Routes = {
  HOME: '/',
  ADVENTURES: 'adventures',
  ADVENTURE: 'adventure',
  NPCS: 'npcs',
  NPC: 'npc',
  SESSIONS: 'sessions',
  SESSION: 'session',
  SETTINGS: 'settings',
} as const;

export type AppRoute = (typeof Routes)[keyof typeof Routes];

export const Route = createFileRoute(Routes.HOME)({
  beforeLoad: () => {
    throw redirect({ to: `/${Routes.ADVENTURES}`, replace: true });
  },
});
