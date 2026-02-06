import { createFileRoute } from '@tanstack/react-router';
import { AdventureScreen } from '@/screens';

export const Route = createFileRoute('/adventure/$adventureId/')({
  loader: async ({ params, context }) => {
    await context.adventureService.loadAdventureById(params.adventureId);
  },
  component: AdventureScreen,
});
