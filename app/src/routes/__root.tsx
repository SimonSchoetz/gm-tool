/* eslint-disable react-refresh/only-export-components -- TanStack Router requires RouterContext and Route to be co-located in the root route file */
import { createRootRoute } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import { App } from '@/App';
import * as adventureService from '@/services/adventureService';
import { ensureInitialized } from '@/services/database';

export type RouterContext = {
  adventureService: typeof adventureService;
};

const RootLayout = () => (
  <>
    <App />
    <TanStackRouterDevtools />
  </>
);

export const Route = createRootRoute({
  component: RootLayout,
  beforeLoad: async () => {
    await ensureInitialized();
  },
});
