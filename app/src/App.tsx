import { Suspense } from 'react';
import { Outlet } from '@tanstack/react-router';
import {
  Backdrop,
  LightSource,
  SideBarNav,
  Header,
  ErrorBoundary,
  GlassPanel,
} from './components';
import { DataAccessProvider, TanstackQueryClientProvider } from './data-access-layer/';
import './App.css';

export const App = () => {
  return (
    <ErrorBoundary>
      <TanstackQueryClientProvider>
        <DataAccessProvider>
          <Backdrop />
          <LightSource intensity='bright' />

          <main className='app'>
            <SideBarNav />

            <div className='screens-container'>
              <Header />

              <ErrorBoundary>
                <Suspense fallback={<GlassPanel>Loading...</GlassPanel>}>
                  <Outlet />
                </Suspense>
              </ErrorBoundary>
            </div>
          </main>
        </DataAccessProvider>
      </TanstackQueryClientProvider>
    </ErrorBoundary>
  );
};
