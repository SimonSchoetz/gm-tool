import { createFileRoute } from '@tanstack/react-router';
import { AdventuresScreen } from '@/screens';
import { Routes } from './index';

export const Route = createFileRoute(Routes.ADVENTURES)({
  component: AdventuresScreen,
});
