import { Suspense } from 'react';
import { Outlet } from '@tanstack/react-router';
import { Backdrop } from '@/components/Backdrop';
import LightSource from '@/components/LightSource/LightSource';
import { SideBarNav } from '@/components/SideBarNav';
import { Header } from '@/components/Header';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { GlassPanel } from '@/components/GlassPanel/GlassPanel';
import { LoadingIcon } from '@/components/LoadingIcon/LoadingIcon';
import { useConnectivityLifecycle } from '@/data-access-layer';
import { AppProviders } from '@/providers/AppProviders/AppProviders';
import './AppContent.css';

export const AppContent = () => {
  // Only call site, ever — a second mount would double-subscribe the event listeners.
  useConnectivityLifecycle();

  return (
    <AppProviders>
      <Backdrop />
      <LightSource intensity='bright' />

      <main className='app-content'>
        <Header />

        <div className='app-content-screens'>
          <SideBarNav />

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
