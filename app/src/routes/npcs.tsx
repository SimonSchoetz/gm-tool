import { createFileRoute } from '@tanstack/react-router';
import { NpcsScreen } from '@/screens';
import { Routes } from './index';

type NpcsSearch = {
  adventureId?: string;
};

export const Route = createFileRoute(Routes.NPCS)({
  component: NpcsScreen,
  validateSearch: (search: Record<string, unknown>): NpcsSearch => {
    return {
      adventureId: search.adventureId as string,
    };
  },
});
