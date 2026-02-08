import { createFileRoute } from '@tanstack/react-router';
import { AdventureScreen } from '@/screens';
import { getAdventureById } from '@/services/adventureService';
import { Routes } from './index';

export const Route = createFileRoute(`${Routes.ADVENTURE}/$adventureId/`)({
  loader: async ({ params }) => {
    const adventure = await getAdventureById(params.adventureId);
    return { adventure };
  },
  component: AdventureScreen,
});
