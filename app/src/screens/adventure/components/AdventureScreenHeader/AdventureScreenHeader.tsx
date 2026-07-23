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

  if (!adventure) return null;

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

      <ul className='adventure-facts'>
        <li>
          Started: <span>{startDate}</span>
        </li>
        <li>
          Sessions: <span>0</span>
        </li>
        <li>
          NPCs: <span>0</span>
        </li>
        <li>
          PCs: <span>0</span>
        </li>
        <li>
          Party Level: <span>0</span>
        </li>
      </ul>
    </div>
  );
};
