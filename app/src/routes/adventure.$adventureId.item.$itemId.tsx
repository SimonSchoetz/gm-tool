import { createFileRoute } from '@tanstack/react-router';
import { ItemScreen } from '@/screens';

export const Route = createFileRoute('/adventure/$adventureId/item/$itemId')({
  component: ItemScreen,
});
