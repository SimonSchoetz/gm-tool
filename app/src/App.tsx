import { Suspense } from 'react';
import { Outlet } from '@tanstack/react-router';
import {
  Backdrop,
  LightSource,
  SideBarNav,
  Header,
  ErrorBoundary,
  GlassPanel,
  LoadingIcon,
} from './components';
import { TanstackQueryClientProvider } from './data-access-layer/TanstackQueryClientProvider';
import { useConnectivityLifecycle } from '@/data-access-layer';
import { AppProviders } from '@/providers';
import './App.css';

// App wraps the provider, so the hook cannot be called in App directly.
const AppContent = () => {
  // Only call site, ever — a second mount would double-subscribe the event listeners.
  useConnectivityLifecycle();

  return (
    <AppProviders>
      <Backdrop />
      <LightSource intensity='bright' />

      <main className='app'>
        <SideBarNav />

        <div className='screens-container'>
          <Header />

          <ErrorBoundary>
            <Suspense
              fallback={
                <GlassPanel className='content-center'>
                  <LoadingIcon />
                </GlassPanel>
              }
            >
              <Outlet />
            </Suspense>
          </ErrorBoundary>
        </div>
      </main>
    </AppProviders>
  );
};

export const App = () => (
  <ErrorBoundary>
    <TanstackQueryClientProvider>
      <AppContent />
    </TanstackQueryClientProvider>
  </ErrorBoundary>
);
