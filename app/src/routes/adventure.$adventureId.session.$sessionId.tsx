import { createFileRoute } from '@tanstack/react-router';
import { SessionScreen } from '@/screens';
import {
  sessionQueryOptions,
  sessionStepListQueryOptions,
} from '@/data-access-layer';

export const Route = createFileRoute(
  '/adventure/$adventureId/session/$sessionId',
)({
  component: SessionScreen,
  loader: async ({ context, params }) => {
    await Promise.all([
      context.queryClient.query({
        ...sessionQueryOptions(params.sessionId),
        staleTime: 'static',
      }),
      context.queryClient.query({
        ...sessionStepListQueryOptions(params.sessionId),
        staleTime: 'static',
      }),
    ]);
  },
});
