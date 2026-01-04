import { createFileRoute } from '@tanstack/react-router';
import { AdventureScreen } from '@/screens';

export const Route = createFileRoute('/')({
  component: AdventureScreen,
});
