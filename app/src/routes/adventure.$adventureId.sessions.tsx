import { createFileRoute } from '@tanstack/react-router';
import { SessionsScreen } from '@/screens';
import {
  sessionListQueryOptions,
  tableConfigListQueryOptions,
} from '@/data-access-layer';

export const Route = createFileRoute('/adventure/$adventureId/sessions')({
  component: SessionsScreen,
  loader: async ({ context, params }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(
        sessionListQueryOptions(params.adventureId),
      ),
      context.queryClient.ensureQueryData(tableConfigListQueryOptions()),
    ]);
  },
});
