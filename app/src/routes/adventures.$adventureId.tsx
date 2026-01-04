import { createFileRoute } from '@tanstack/react-router';
import { SessionScreen } from '@/screens';

export const Route = createFileRoute('/adventures/$adventureId')({
  component: SessionScreen,
});
