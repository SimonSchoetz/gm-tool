import { SyncedInput } from '@/components';
import {
  useAdventure,
  useSessions,
  usePcs,
  useNpcs,
  useFactions,
  useLocations,
  useFoes,
  useItems,
} from '@/data-access-layer';
import { useParams } from '@tanstack/react-router';
import { getDateTimeString } from '@util';
import './AdventureScreenHeader.css';

export const AdventureScreenHeader = () => {
  const { adventureId } = useParams({
    from: '/adventure/$adventureId/',
  });

  const { adventure, updateAdventure } = useAdventure(adventureId);
  const { sessions } = useSessions(adventureId);
  const { pcs } = usePcs(adventureId);
  const { npcs } = useNpcs(adventureId);
  const { factions } = useFactions(adventureId);
  const { locations } = useLocations(adventureId);
  const { foes } = useFoes(adventureId);
  const { items } = useItems(adventureId);

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
          <span className='label'>Sessions:</span>
          {sessions.length}
        </li>
        <li>
          <span className='label'>PCs:</span>
          {pcs.length}
        </li>
        <li>
          <span className='label'>NPCs:</span>
          {npcs.length}
        </li>
        <li>
          <span className='label'>Factions:</span>
          {factions.length}
        </li>
        <li>
          <span className='label'>Locations:</span>
          {locations.length}
        </li>
        <li>
          <span className='label'>Foes:</span>
          {foes.length}
        </li>
        <li>
          <span className='label'>Items:</span>
          {items.length}
        </li>
      </ul>
    </div>
  );
};
