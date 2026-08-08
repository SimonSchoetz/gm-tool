import { createFileRoute } from '@tanstack/react-router';
import { EncounterScreen } from '@/screens';

export const Route = createFileRoute(
  '/adventure/$adventureId/encounter/$encounterId',
)({
  component: EncounterScreen,
});
