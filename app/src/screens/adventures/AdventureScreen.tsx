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
    <div className='content-center adventure-list-container'>
      <CreateAdventurePopUp />
      <AdventureList adventures={adventures} />
    </div>
  );
};

export default AdventureScreen;
