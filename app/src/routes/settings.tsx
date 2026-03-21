import { createFileRoute } from '@tanstack/react-router';
import { SettingsScreen } from '@/screens';

export const Route = createFileRoute('/settings')({
  component: SettingsScreen,
});
