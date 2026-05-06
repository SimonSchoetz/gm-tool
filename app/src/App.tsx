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
import { TanstackQueryClientProvider } from './data-access-layer/TanstackQueryClientProvider';
import { AppProviders } from '@/providers';
import './App.css';

export const App = () => (
  <ErrorBoundary>
    <TanstackQueryClientProvider>
      <AppProviders>
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
      </AppProviders>
    </TanstackQueryClientProvider>
  </ErrorBoundary>
);
