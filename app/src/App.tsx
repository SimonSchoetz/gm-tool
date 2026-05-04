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
import { DeleteDialogProvider, PinnedPopupsProvider } from '@/providers';
import './App.css';

export const App = () => {
  return (
    <DeleteDialogProvider>
      <ErrorBoundary>
        <TanstackQueryClientProvider>
          <PinnedPopupsProvider>
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
          </PinnedPopupsProvider>
        </TanstackQueryClientProvider>
      </ErrorBoundary>
    </DeleteDialogProvider>
  );
};
