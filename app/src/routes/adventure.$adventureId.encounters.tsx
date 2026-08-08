import { createFileRoute } from '@tanstack/react-router';
import { EncountersScreen } from '@/screens';

export const Route = createFileRoute('/adventure/$adventureId/encounters')({
  component: EncountersScreen,
});
