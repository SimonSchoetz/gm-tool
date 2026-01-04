import { Outlet } from '@tanstack/react-router';
import { Backdrop, LightSource, SideBarNav } from './components';
import { DataProvider } from './data/DataProvider';
import './App.css';

export const App = () => {
  return (
    <DataProvider>
      <main className='app'>
        <Backdrop />

        <LightSource intensity='bright' />

        <div className='app-container'>
          <SideBarNav />

          <Outlet />
        </div>
      </main>
    </DataProvider>
  );
};
