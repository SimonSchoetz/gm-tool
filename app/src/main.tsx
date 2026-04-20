import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider, createRouter } from '@tanstack/react-router';
import type { RouterContext } from './routes/__root';
import './styles/reset.css';
import './styles/variables.css';
import './styles/global.css';
import './styles/scrollbar.css';

// Import the generated route tree
import { routeTree } from './routeTree.gen';

// Create a new router instance
const router = createRouter({ routeTree });

// Register the router instance and context for type safety
/* eslint-disable @typescript-eslint/consistent-type-definitions, @typescript-eslint/no-empty-object-type -- TanStack Router requires interface for declaration merging */
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
  interface RouteContext extends RouterContext {}
}
/* eslint-enable @typescript-eslint/consistent-type-definitions, @typescript-eslint/no-empty-object-type */

// Render the app
const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root element not found');
if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <RouterProvider router={router} />
    </React.StrictMode>,
  );
}
