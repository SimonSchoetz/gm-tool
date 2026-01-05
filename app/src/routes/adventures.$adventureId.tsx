import { createFileRoute } from '@tanstack/react-router';
import { SessionScreen } from '@/screens';
import { Routes } from './index';

export const Route = createFileRoute(`${Routes.ADVENTURES}/$adventureId`)({
  component: SessionScreen,
});
