import { useParams } from '@tanstack/react-router';
import { useEncounter } from '@/data-access-layer';
import { LoadingIcon } from '@/components/LoadingIcon/LoadingIcon';
import { TextEditor } from '@/components/TextEditor';
import { EncounterHeader } from './components/EncounterHeader';
import { EncounterSidebar } from './components/EncounterSidebar';
import { ScreensTextEditorLayout } from '../components/ScreensTextEditorLayout/ScreensTextEditorLayout';

export const EncounterScreen = () => {
  const { adventureId, encounterId } = useParams({
    from: '/adventure/$adventureId/encounter/$encounterId',
  });

  const { encounter, updateEncounter, loading } = useEncounter(
    encounterId,
    adventureId,
  );

  if (loading || !encounter) {
    return (
      <div className='content-center'>
        <LoadingIcon />
      </div>
    );
  }

  return (
    <ScreensTextEditorLayout
      header={<EncounterHeader />}
      sideBar={<EncounterSidebar />}
      body={
        <TextEditor
          value={encounter.description ?? ''}
          textEditorId={`ENCOUNTER_${encounter.id}_description`}
          onChange={(description) => {
            updateEncounter({ description });
          }}
        />
      }
    />
  );
};
