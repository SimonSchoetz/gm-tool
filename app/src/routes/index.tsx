import { createFileRoute, redirect } from '@tanstack/react-router';

export enum Routes {
  HOME = '/',
  ADVENTURES = 'adventures',
  ADVENTURE = 'adventure',
  NPCS = 'npcs',
  NPC = 'npc',
}

export const Route = createFileRoute(Routes.HOME)({
  beforeLoad: () => {
    throw redirect({ to: `/${Routes.ADVENTURES}`, replace: true });
  },
});
