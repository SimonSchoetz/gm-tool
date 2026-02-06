import { useAdventures } from '@/providers/adventures';
import './AdventuresScreen.css';
import { ToAdventureBtn } from '../../components/AdventureComponents';
import { NewItemBtn } from '@/components';
import { useRouter } from '@tanstack/react-router';
import { Routes } from '@/routes';

export const AdventuresScreen = () => {
  const router = useRouter();
  const { adventures, loading, createAdventure } = useAdventures();

  const handleAdventureCreation = async () => {
    try {
      const newAdventureId = await createAdventure();
      router.navigate({ to: `${Routes.ADVENTURE}/${newAdventureId}` });
    } catch (err) {
      // TODO: Add toast notification or inline error display
      // For now, errors during creation will prevent navigation
      // Future: could trigger error boundary or show user-friendly message
    }
  };

  if (loading) {
    return <div className='content-center'>Loading...</div>;
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
