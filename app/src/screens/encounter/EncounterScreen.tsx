import { useParams } from '@tanstack/react-router';
import { useEncounter } from '@/data-access-layer';
import { GlassPanel } from '@/components/GlassPanel/GlassPanel';
import { LoadingIcon } from '@/components/LoadingIcon/LoadingIcon';
import { EncounterHeader } from './components/EncounterHeader';
import { EncounterNotes } from './components/EncounterNotes/EncounterNotes';
import { EncounterQueue } from './components/EncounterQueue';
import { EncounterQueueActions } from './components/EncounterQueueActions';
import { EncounterSidePanel } from './components/EncounterSidePanel';
import { PREVIEW_WIDTH } from '../screens.constants';
import './EncounterScreen.css';

export const EncounterScreen = () => {
  const { adventureId, encounterId } = useParams({
    from: '/adventure/$adventureId/encounter/$encounterId',
  });

  const { encounter, loading } = useEncounter(encounterId, adventureId);

  if (loading || !encounter) {
    return (
      <div className='content-center'>
        <LoadingIcon />
      </div>
    );
  }

  return (
    <GlassPanel
      style={
        {
          '--encounter-screen-side-width': `${PREVIEW_WIDTH * 1.5}px`,
        } as React.CSSProperties
      }
      className='encounter-screen'
    >
      <header className='encounter-screen-header'>
        <EncounterHeader />
      </header>

      <div className='encounter-screen-body'>
        <div className='encounter-screen-queue-column'>
          <EncounterQueue />
          <EncounterQueueActions />
        </div>
        <div className='encounter-screen-middle-column'>
          <EncounterNotes />
        </div>
        <div className='encounter-screen-side-column'>
          <EncounterSidePanel />
        </div>
      </div>
    </GlassPanel>
  );
};
