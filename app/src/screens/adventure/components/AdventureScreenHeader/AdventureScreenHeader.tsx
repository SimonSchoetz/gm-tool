import { SyncedInput } from '@/components';
import { useAdventure } from '@/data-access-layer';
import { useParams } from '@tanstack/react-router';
import { getDateTimeString } from '@util';
import './AdventureScreenHeader.css';

export const AdventureScreenHeader = () => {
  const { adventureId } = useParams({
    from: '/adventure/$adventureId/',
  });

  const { adventure, updateAdventure } = useAdventure(adventureId);

  if (!adventure) return;

  const startDate = getDateTimeString(adventure.created_at);

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

      <ul className='adventure-stats'>
        <li>
          <span className='label'>Started:</span>
          {startDate}
        </li>
        <li>
          <span className='label'>Sessions:</span>0
        </li>
        <li>
          <span className='label'>PCs:</span>0
        </li>
        <li>
          <span className='label'>NPCs:</span>0
        </li>
        <li>
          <span className='label'>Factions:</span>0
        </li>
        <li>
          <span className='label'>Locations:</span>0
        </li>
        <li>
          <span className='label'>Foes:</span>0
        </li>
        <li>
          <span className='label'>Items:</span>0
        </li>
      </ul>
    </div>
  );
};
