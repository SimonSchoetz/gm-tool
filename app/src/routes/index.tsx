import { createFileRoute } from '@tanstack/react-router';
import { AdventureScreen } from '@/screens';

export enum Routes {
  HOME = '/',
  ADVENTURES = '/adventures',
}

export const Route = createFileRoute(Routes.HOME)({
  component: AdventureScreen,
});
