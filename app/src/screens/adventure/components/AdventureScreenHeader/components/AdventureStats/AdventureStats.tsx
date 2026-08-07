import { FCProps } from '@/types';
import './AdventureStats.css';
import {
  useSessions,
  usePcs,
  useNpcs,
  useFactions,
  useLocations,
  useFoes,
  useItems,
  useAdventure,
} from '@/data-access-layer';
import { useParams } from '@tanstack/react-router';
import { getDateString } from '@util';

type Props = object;

export const AdventureStats: FCProps<Props> = () => {
  const { adventureId } = useParams({
    from: '/adventure/$adventureId/',
  });
  const { adventure } = useAdventure(adventureId);
  const { sessions } = useSessions(adventureId);
  const { pcs } = usePcs(adventureId);
  const { npcs } = useNpcs(adventureId);
  const { factions } = useFactions(adventureId);
  const { locations } = useLocations(adventureId);
  const { foes } = useFoes(adventureId);
  const { items } = useItems(adventureId);
  if (!adventure) return;

  const startDate = getDateString(adventure.created_at);
  return (
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
  );
};
