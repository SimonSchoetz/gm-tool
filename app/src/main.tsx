import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider, createRouter } from '@tanstack/react-router';
import type { RouterContext } from './routes/__root';
import './styles/reset.css';
import './styles/variables.css';
import './styles/global.css';
import './styles/button.css';
import './styles/scrollbar.css';

// Import the generated route tree
import { routeTree } from './routeTree.gen';

// Create a new router instance
const router = createRouter({ routeTree });

// Register the router instance and context for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
  interface RouteContext extends RouterContext {}
}

// Render the app
const rootElement = document.getElementById('root')!;
if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <RouterProvider router={router} />
    </React.StrictMode>,
  );
}
