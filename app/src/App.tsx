import { useEffect } from 'react';
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
import { useCheckUpdate, useInstallUpdate } from '@/data-access-layer';
import { AppProviders } from '@/providers';
import './App.css';

// useCheckUpdate calls useQuery, which requires TanstackQueryClientProvider above it in the tree.
// App wraps the provider, so the hook cannot be called in App directly.
const AppContent = () => {
  const { availableVersion } = useCheckUpdate();
  const { installUpdate } = useInstallUpdate();

  // Temporary: auto-install on startup until the update UI is built.
  // installUpdate is excluded from deps — it is not memoised and would re-run
  // the effect on every render. availableVersion changes at most once (null → version),
  // so the effect fires exactly once when an update is found.
  useEffect(() => {
    if (availableVersion !== null) {
      void installUpdate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availableVersion]);

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
