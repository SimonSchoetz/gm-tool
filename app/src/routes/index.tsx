import { AdventuresScreen } from '@/screens';
import { createFileRoute } from '@tanstack/react-router';

export enum Routes {
  HOME = '/',
  ADVENTURES = '/adventures',
}

export const Route = createFileRoute(Routes.HOME)({
  component: AdventuresScreen,
});
