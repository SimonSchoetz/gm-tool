import './AdventureStats.css';
import {
  useSessions,
  useEncounters,
  useBaseEntities,
  useAdventure,
} from '@/data-access-layer';
import { useParams } from '@tanstack/react-router';
import { getDateString } from '@util';

export const AdventureStats = () => {
  const { adventureId } = useParams({
    from: '/adventure/$adventureId/',
  });
  const { adventure } = useAdventure(adventureId);
  const { sessions } = useSessions(adventureId);
  const { encounters } = useEncounters(adventureId);
  const { baseEntities: pcs } = useBaseEntities('pcs', adventureId);
  const { baseEntities: npcs } = useBaseEntities('npcs', adventureId);
  const { baseEntities: factions } = useBaseEntities('factions', adventureId);
  const { baseEntities: locations } = useBaseEntities('locations', adventureId);
  const { baseEntities: foes } = useBaseEntities('foes', adventureId);
  const { baseEntities: items } = useBaseEntities('items', adventureId);
  if (!adventure) return;

  const startDate = getDateString(adventure.created_at);

  const statsMap: { label: string; value: number | string }[] = [
    { label: 'Started', value: startDate },
    { label: 'Sessions', value: sessions.length },
    { label: 'Encounters', value: encounters.length },
    { label: 'PCs', value: pcs.length },
    { label: 'NPCs', value: npcs.length },
    { label: 'Factions', value: factions.length },
    { label: 'Locations', value: locations.length },
    { label: 'Foes', value: foes.length },
    { label: 'Items', value: items.length },
  ];

  return (
    <ul className='adventure-stats'>
      {statsMap.map(({ label, value }) => (
        <li key={label}>
          <span className='label'>{label}:</span>
          {value}
        </li>
      ))}
    </ul>
  );
};
