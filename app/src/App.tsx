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
import { useCheckUpdate } from '@/data-access-layer';
import { AppProviders } from '@/providers';
import './App.css';

// useCheckUpdate calls useQuery, which requires TanstackQueryClientProvider above it in the tree.
// App wraps the provider, so the hook cannot be called in App directly.
const AppContent = () => {
  useCheckUpdate();

  return (
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
  );
};

export const App = () => (
  <ErrorBoundary>
    <TanstackQueryClientProvider>
      <AppContent />
    </TanstackQueryClientProvider>
  </ErrorBoundary>
);
