import { Outlet } from '@tanstack/react-router';
import { Backdrop, LightSource, SideBarNav, Header } from './components';
import { DataProvider } from './data/DataProvider';
import './App.css';

export const App = () => {
  return (
    <DataProvider>
      <Backdrop />
      <LightSource intensity='bright' />

      <main className='app'>
        <SideBarNav />

        <div className='screens-container'>
          <Header />

          <Outlet />
        </div>
      </main>
    </DataProvider>
  );
};
