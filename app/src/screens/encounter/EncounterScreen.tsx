import { useRef } from 'react';
import { useParams } from '@tanstack/react-router';
import { useEncounter } from '@/data-access-layer';
import { GlassPanel } from '@/components/GlassPanel/GlassPanel';
import { LoadingIcon } from '@/components/LoadingIcon/LoadingIcon';
import { EncounterHeader } from './components/EncounterHeader';
import { EncounterCover } from './components/EncounterCover/EncounterCover';
import { EncounterNotes } from './components/EncounterNotes/EncounterNotes';
import { EncounterQueue } from './components/EncounterQueue';
import { EncounterShownItem } from './components/EncounterShownItem';
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
  const middleColumnRef = useRef<HTMLDivElement | null>(null);
  const { selectedIds, shownItemId, activeTab, select, setActiveTab } =
    useEncounterSelection(
      encounterId,
      entries.map((entry) => entry.id),
      middleColumnRef,
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
          '--encounter-screen-queue-column-width': `${PREVIEW_WIDTH}px`,
          '--encounter-screen-side-column-width': `${PREVIEW_WIDTH}px`,
        } as React.CSSProperties
      }
      className='encounter-screen'
    >
      <header className='encounter-screen-header'>
        <EncounterHeader />
      </header>

      <div className='encounter-screen-body'>
        <div className='encounter-screen-queue-column'>
          <EncounterCover />
          <EncounterQueue selectedIds={selectedIds} onSelect={select} />
          <EncounterActions />
        </div>
        <div ref={middleColumnRef} className='encounter-screen-middle-column'>
          <EncounterNotes />
          <EncounterShownItem shownItemId={shownItemId} />
        </div>
        <div className='encounter-screen-side-column'>
          <EncounterSidebar
            // Keyed by the encounter id so opening a duplicated encounter starts on Entities and Event with empty fields even when the screen stays mounted across the id change.
            key={encounterId}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            selectedIds={selectedIds}
          />
        </div>
      </div>
    </GlassPanel>
  );
};
