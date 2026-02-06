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
import { DataProvider } from './providers/DataProvider';
import './App.css';

export const App = () => {
  return (
    <ErrorBoundary>
      <DataProvider>
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
      </DataProvider>
    </ErrorBoundary>
  );
};
