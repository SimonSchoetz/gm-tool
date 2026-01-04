import { Outlet } from '@tanstack/react-router';
import { Backdrop, LightSource } from './components';
import { DataProvider } from './data/DataProvider';
import './App.css';

export const App = () => {
  return (
    <DataProvider>
      <main className='app'>
        <Backdrop />
        <LightSource intensity='bright' />
        <div className='screens-container'>
          <Outlet />
        </div>
      </main>
    </DataProvider>
  );
};
