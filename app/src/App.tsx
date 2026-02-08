import { Suspense } from 'react';
import { Outlet } from '@tanstack/react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
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

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
    mutations: {
      throwOnError: true, // Errors bubble to Error Boundary
    },
  },
});

export const App = () => {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
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
      </QueryClientProvider>
    </ErrorBoundary>
  );
};
