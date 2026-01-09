import { createFileRoute, redirect } from '@tanstack/react-router';

export enum Routes {
  HOME = '/',
  ADVENTURES = '/adventures',
  ADVENTURE = '/adventure',
}

export const Route = createFileRoute(Routes.HOME)({
  beforeLoad: () => {
    throw redirect({ to: `${Routes.ADVENTURES}`, replace: true });
  },
});
