import { Backdrop, LightSource } from './components';
import { AdventureScreen } from './screens';
import { DataProvider } from './data/DataProvider';
import './App.css';

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
