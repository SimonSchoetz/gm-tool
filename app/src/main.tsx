import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider, createRouter } from '@tanstack/react-router';
import './styles/index.css';
import '@fontsource/ibm-plex-sans/400.css';
import '@fontsource/ibm-plex-sans/400-italic.css';
import '@fontsource/ibm-plex-sans/500.css';
import '@fontsource/ibm-plex-sans/500-italic.css';
import '@fontsource/ibm-plex-sans/600.css';
import '@fontsource/ibm-plex-sans/700.css';
import '@fontsource/ibm-plex-sans/700-italic.css';
import '@fontsource/ibm-plex-mono/400.css';
import { queryClient, TanstackQueryClientProvider } from '@/data-access-layer';

// Import the generated route tree
import { routeTree } from './routeTree.gen';

// Create a new router instance
const router = createRouter({
  routeTree,
  context: { queryClient },
  defaultPreload: 'intent',
  defaultPreloadStaleTime: 0,
});

// Register the router instance and context for type safety
/* eslint-disable @typescript-eslint/consistent-type-definitions */
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
/* eslint-enable @typescript-eslint/consistent-type-definitions */

// Render the app
const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root element not found');
if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <TanstackQueryClientProvider>
        <RouterProvider router={router} />
      </TanstackQueryClientProvider>
    </React.StrictMode>,
  );
}
