import { Backdrop, LightSource } from './components';
import { AdventureScreen } from './screens';
import { DataProvider } from './data/DataProvider';
import './App.css';

/**
 * In the future, instead of rendering conditionally, we'll use TanStack Router
 */

function App() {
  return (
    <DataProvider>
      <main className='app'>
        <Backdrop />
        <LightSource intensity='bright' />
        <div className='screens-container'>
          <AdventureScreen />
        </div>
      </main>
    </DataProvider>
  );
}

export default App;
