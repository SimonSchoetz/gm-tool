import { createFileRoute } from '@tanstack/react-router';
import { PcScreen } from '@/screens';

export const Route = createFileRoute('/adventure/$adventureId/pc/$pcId')({
  component: PcScreen,
});
