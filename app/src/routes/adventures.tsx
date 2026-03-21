import { createFileRoute } from '@tanstack/react-router';
import { AdventuresScreen } from '@/screens';

export const Route = createFileRoute('/adventures')({
  component: AdventuresScreen,
});
