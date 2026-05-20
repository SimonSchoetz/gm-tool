import { createFileRoute } from '@tanstack/react-router';
import { ItemsScreen } from '@/screens';

export const Route = createFileRoute('/adventure/$adventureId/items')({
  component: ItemsScreen,
});
