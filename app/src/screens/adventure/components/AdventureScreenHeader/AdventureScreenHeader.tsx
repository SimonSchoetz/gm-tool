import { SyncedInput } from '@/components/SyncedInput/SyncedInput';
import { useAdventure } from '@/data-access-layer';
import { useParams } from '@tanstack/react-router';
import './AdventureScreenHeader.css';
import { AdventureStats } from './components/AdventureStats/AdventureStats';

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
