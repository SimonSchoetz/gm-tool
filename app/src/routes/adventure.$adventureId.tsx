import { createFileRoute } from '@tanstack/react-router';
import { AdventureScreen } from '@/screens';
import { Routes } from './index';

export const Route = createFileRoute(`${Routes.ADVENTURE}/$adventureId`)({
  component: AdventureScreen,
});
