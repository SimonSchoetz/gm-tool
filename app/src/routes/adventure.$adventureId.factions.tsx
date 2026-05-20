import { createFileRoute } from '@tanstack/react-router';
import { FactionsScreen } from '@/screens';

export const Route = createFileRoute('/adventure/$adventureId/factions')({
  component: FactionsScreen,
});
