import { Outlet } from '@tanstack/react-router';
import { Backdrop, LightSource, SideBarNav, Header, ErrorBoundary } from './components';
import { DataProvider } from './data/DataProvider';
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
              <Outlet />
            </ErrorBoundary>
          </div>
        </main>
      </DataProvider>
    </ErrorBoundary>
  );
};
