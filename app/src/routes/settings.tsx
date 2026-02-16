import { createFileRoute } from '@tanstack/react-router';
import { SettingsScreen } from '@/screens';
import { Routes } from './index';

export const Route = createFileRoute(`/${Routes.SETTINGS}`)({
  component: SettingsScreen,
});
