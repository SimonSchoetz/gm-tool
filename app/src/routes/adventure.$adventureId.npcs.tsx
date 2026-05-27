import { createFileRoute } from '@tanstack/react-router';
import { NpcsScreen } from '@/screens';

export const Route = createFileRoute('/adventure/$adventureId/npcs')({
  component: NpcsScreen,
});
