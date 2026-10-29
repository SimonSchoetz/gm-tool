import { useParams } from '@tanstack/react-router';
import { useEncounter } from '@/data-access-layer';
import { GlassPanel } from '@/components/GlassPanel/GlassPanel';
import { LoadingIcon } from '@/components/LoadingIcon/LoadingIcon';
import { EncounterHeader } from './components/EncounterHeader';
import { EncounterNotes } from './components/EncounterNotes/EncounterNotes';
import { EncounterQueue } from './components/EncounterQueue';
import { EncounterActions } from './components/EncounterActions/EncounterActions';
import { EncounterSidebar } from './components/EncounterSidebar';
import { useEncounterQueueEntries } from './hooks/useEncounterQueueEntries';
import { useEncounterSelection } from './hooks/useEncounterSelection';
import { PREVIEW_WIDTH } from '../screens.constants';
import './EncounterScreen.css';

export const EncounterScreen = () => {
  const { adventureId, encounterId } = useParams({
    from: '/adventure/$adventureId/encounter/$encounterId',
  });

  const { encounter, loading } = useEncounter(encounterId, adventureId);
  const { entries } = useEncounterQueueEntries();
  const { selectedIds, activeTab, select, setActiveTab } =
    useEncounterSelection(
      encounterId,
      entries.map((entry) => entry.id),
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
          <EncounterQueue selectedIds={selectedIds} onSelect={select} />
          <EncounterActions />
        </div>
        <div className='encounter-screen-middle-column'>
          <EncounterNotes />
        </div>
        <div className='encounter-screen-side-column'>
          <EncounterSidebar
            activeTab={activeTab}
            onTabChange={setActiveTab}
            selectedIds={selectedIds}
          />
        </div>
      </div>
    </GlassPanel>
  );
};
