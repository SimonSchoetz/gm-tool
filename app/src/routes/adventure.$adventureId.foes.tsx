import { createFileRoute } from '@tanstack/react-router';
import { FoesScreen } from '@/screens';
import {
  foeListQueryOptions,
  tableConfigListQueryOptions,
} from '@/data-access-layer';

export const Route = createFileRoute('/adventure/$adventureId/foes')({
  component: FoesScreen,
  loader: async ({ context, params }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(
        foeListQueryOptions(params.adventureId),
      ),
      context.queryClient.ensureQueryData(tableConfigListQueryOptions()),
    ]);
  },
});
