import { Outlet } from '@tanstack/react-router';
import { Backdrop, LightSource, SideBarNav, Header } from './components';
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

          <div>
            <Header />

            <Outlet />
          </div>
        </div>
      </main>
    </DataProvider>
  );
};
