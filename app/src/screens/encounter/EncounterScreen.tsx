import { useParams } from '@tanstack/react-router';
import { useEncounter } from '@/data-access-layer';
import { GlassPanel, LoadingIcon, TextEditor } from '@/components';
import { EncounterHeader, EncounterSidebar } from './components';
import './EncounterScreen.css';
import { PREVIEW_WIDTH } from '../screens.constants';

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
    <GlassPanel
      className='encounter-screen'
      style={
        {
          '--encounter-screen-sidebar-width': `${PREVIEW_WIDTH}px`,
        } as React.CSSProperties
      }
    >
      <EncounterHeader />

      <div className='encounter-body'>
        <EncounterSidebar />

        <TextEditor
          value={encounter.description ?? ''}
          textEditorId={`ENCOUNTER_${encounter.id}_description`}
          onChange={(description) => {
            updateEncounter({ description });
          }}
        />
      </div>
    </GlassPanel>
  );
};
