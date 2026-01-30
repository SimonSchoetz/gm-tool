import { useAdventures } from '@/data/adventures';
import './AdventuresScreen.css';
import { ToAdventureBtn } from '../../components/AdventureComponents';
import { NewItemBtn } from '@/components';
import { useRouter } from '@tanstack/react-router';
import { Routes } from '@/routes';

export const AdventuresScreen = () => {
  const router = useRouter();
  const { adventures, loading, error, createAdventure } = useAdventures();

  const handleAdventureCreation = async () => {
    const newAdventureId = await createAdventure();
    router.navigate({ to: `${Routes.ADVENTURE}/${newAdventureId}` });
  };

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
            onClick={handleAdventureCreation}
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
