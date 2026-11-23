import { useParams } from '@tanstack/react-router';
import { useEncounter } from '@/data-access-layer';
import { ScreensNameInput } from '../../components/ScreensNameInput/ScreensNameInput';
import { ScreensNameRow } from '../../components/ScreensNameRow/ScreensNameRow';

export const EncounterHeader = () => {
  const { adventureId, encounterId } = useParams({
    from: '/adventure/$adventureId/encounter/$encounterId',
  });
  const { encounter, updateEncounter } = useEncounter(encounterId, adventureId);

  if (!encounter) return;

  const onNameCommit = (name: string) => {
    updateEncounter({ name });
  };

  return (
    <ScreensNameRow entityType='encounters'>
      <ScreensNameInput
        placeholder='Encounter Name'
        initValue={encounter.name ?? ''}
        onCommit={onNameCommit}
      />
    </ScreensNameRow>
  );
};
