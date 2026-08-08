import { useParams } from '@tanstack/react-router';
import { useEncounter } from '@/data-access-layer';
import { ScreensNameInput } from '../../components';

export const EncounterHeader = () => {
  const { adventureId, encounterId } = useParams({
    from: '/adventure/$adventureId/encounter/$encounterId',
  });
  const { encounter, updateEncounter } = useEncounter(encounterId, adventureId);

  if (!encounter) return;

  return (
    <ScreensNameInput
      placeholder='Encounter Name'
      initValue={encounter.name ?? ''}
      onCommit={(name) => {
        updateEncounter({ name });
      }}
    />
  );
};
