/* eslint-disable react-refresh/only-export-components -- TanStack Router requires RouterContext and Route to be co-located in the root route file */
import { createRootRouteWithContext } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import type { QueryClient } from '@tanstack/react-query';
import { App } from '@/App';
import { ensureInitialized } from '@services/database';

const RootLayout = () => (
  <>
    <App />
    <TanStackRouterDevtools />
  </>
);

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()(
  {
    component: RootLayout,
    beforeLoad: async () => {
      await ensureInitialized();
    },
  },
);
