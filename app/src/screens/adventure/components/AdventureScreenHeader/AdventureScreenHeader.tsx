import { SyncedInput } from '@/components';
import { useAdventure } from '@/data-access-layer';
import { useParams } from '@tanstack/react-router';
import './AdventureScreenHeader.css';
import { AdventureStats } from './components';

export const AdventureScreenHeader = () => {
  const { adventureId } = useParams({
    from: '/adventure/$adventureId/',
  });

  const { adventure, updateAdventure } = useAdventure(adventureId);
  if (!adventure) return;

  return (
    <div>
      <SyncedInput
        placeholder='Adventure Title'
        initValue={adventure.name ?? ''}
        onCommit={(name) => {
          updateAdventure({ name });
        }}
        className='adventure-title-input'
      />

      <AdventureStats />
    </div>
  );
};
