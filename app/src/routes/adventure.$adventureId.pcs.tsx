import { createFileRoute } from '@tanstack/react-router';
import { PcsScreen } from '@/screens';

export const Route = createFileRoute('/adventure/$adventureId/pcs')({
  component: PcsScreen,
});
