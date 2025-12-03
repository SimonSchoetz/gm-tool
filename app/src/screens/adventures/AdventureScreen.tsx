import { useAdventures } from '@/data/adventures';
import './AdventureScreen.css';
import { AdventureList, CreateAdventurePopUp } from './components';

const AdventureScreen = () => {
  const { adventures, loading, error } = useAdventures();

  if (loading) {
    return <div className='content-center'>Loading...</div>;
  }

  if (error) {
    return (
      <div className='content-center'>
        <h1>Error</h1>
        <p style={{ color: 'red' }}>{error}</p>
        <p>Check the browser console for more details</p>
      </div>
    );
  }

  return (
    <div>
      <ul className='content-center adventure-list-container'>
        <li key='new-adventure'>
          <CreateAdventurePopUp />
        </li>
        <AdventureList adventures={adventures} />
      </ul>
    </div>
  );
};

export default AdventureScreen;
