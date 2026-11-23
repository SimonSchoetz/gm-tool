import { useParams } from '@tanstack/react-router';
import { Checkbox } from '@/components/Checkbox/Checkbox';
import { useEncounter } from '@/data-access-layer';
import './EncounterActions.css';

export const EncounterActions = () => {
  const { adventureId, encounterId } = useParams({
    from: '/adventure/$adventureId/encounter/$encounterId',
  });
  const { encounter, updateEncounter } = useEncounter(encounterId, adventureId);

  if (!encounter) return;

  const onHideDefeatedChange = () => {
    updateEncounter({
      hide_defeated: encounter.hide_defeated === 1 ? 0 : 1,
    });
  };

  return (
    <div className='encounter-actions-hide-defeated'>
      <Checkbox
        id='encounter-hide-defeated'
        checked={encounter.hide_defeated === 1}
        onChange={onHideDefeatedChange}
      />
      <label htmlFor='encounter-hide-defeated'>Hide defeated</label>
    </div>
  );
};
