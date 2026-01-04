import { createRootRoute, Outlet } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import { Backdrop, LightSource } from '@/components';
import { DataProvider } from '@/data/DataProvider';
import './__root.css';

const RootLayout = () => (
  <DataProvider>
    <main className='app'>
      <Backdrop />
      <LightSource intensity='bright' />
      <div className='screens-container'>
        <Outlet />
      </div>
    </main>
    <TanStackRouterDevtools />
  </DataProvider>
);

export const Route = createRootRoute({ component: RootLayout });
