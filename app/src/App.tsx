import { Backdrop, LightSource } from './components';
import { AdventureScreen } from './screens';
import './App.css';

function App() {
  return (
    <main className='app'>
      <Backdrop />
      <LightSource intensity='bright' />
      <div className='screens-container'>
        <AdventureScreen />
      </div>
    </main>
  );
}

export default App;
