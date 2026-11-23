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
      {/* Keyed by entity id: the router reuses this screen for the copy a Duplicate opens, and `autoFocus` only acts when the input mounts. */}
      <ScreensNameInput
        key={encounter.id}
        placeholder='Encounter Name'
        initValue={encounter.name ?? ''}
        onCommit={onNameCommit}
      />
    </ScreensNameRow>
  );
};
