import { useAdventures } from '@/data/adventures';
import './AdventuresScreen.css';
import { ToAdventureBtn } from '../../components/AdventureComponents';
import { NewItemBtn } from '@/components';

export const AdventuresScreen = () => {
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
          <NewItemBtn
            type='adventure'
            label='+'
            onClick={() => console.log('new adventure clicked')}
          />
        </li>

        {adventures.map((adventure) => (
          <li key={adventure.id}>
            <ToAdventureBtn adventure={adventure} />
          </li>
        ))}
      </ul>
    </div>
  );
};
