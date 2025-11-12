import { Backdrop, LightSource } from './components';
import { SessionScreen } from './screens';

function App() {
  return (
    <main className='container'>
      <Backdrop />
      <LightSource intensity='bright' />
      <SessionScreen />
    </main>
  );
}

export default App;
