import { Backdrop, LightSource } from './components';
import { SessionScreen } from './screens';
import './App.css';

function App() {
  return (
    <main className='app'>
      <Backdrop />
      <LightSource intensity='bright' />
      <div className='screens-container'>
        <SessionScreen />
      </div>
    </main>
  );
}

export default App;
