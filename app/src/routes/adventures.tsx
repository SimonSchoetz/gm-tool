import { createFileRoute } from '@tanstack/react-router';
import { AdventuresScreen } from '@/screens';
import { adventureListQueryOptions } from '@/data-access-layer';

export const Route = createFileRoute('/adventures')({
  component: AdventuresScreen,
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(adventureListQueryOptions()),
});
