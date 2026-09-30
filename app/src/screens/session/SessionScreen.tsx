import { useState } from 'react';
import { useParams } from '@tanstack/react-router';
import { useSession, useSessionSteps } from '@/data-access-layer';
import { SessionHeader } from './components/SessionHeader';
import { PrepView } from './components/PrepView';
import { InGameView } from './components/InGameView';
import { StepsNavSidebar } from './components/StepsNavSidebar';
import './SessionScreen.css';
import { GlassPanel } from '@/components/GlassPanel/GlassPanel';
import { LoadingIcon } from '@/components/LoadingIcon/LoadingIcon';
import { PREVIEW_WIDTH } from '../screens.constants';

export const SessionScreen = () => {
  const { sessionId, adventureId } = useParams({
    from: '/adventure/$adventureId/session/$sessionId',
  });

  const { session, loading } = useSession(sessionId, adventureId);
  const { steps } = useSessionSteps(sessionId);

  const [visibleTooltips, setVisibleTooltips] = useState<Set<string>>(
    new Set(),
  );

  const defaultStepIds = steps
    .filter((s) => s.default_step_key !== null)
    .map((s) => s.id);

  const toggleTooltipForStep = (stepId: string) => {
    setVisibleTooltips((prev) => {
      const next = new Set(prev);
      if (next.has(stepId)) {
        next.delete(stepId);
      } else {
        next.add(stepId);
      }
      return next;
    });
  };

  const toggleAllTooltips = () => {
    setVisibleTooltips(
      visibleTooltips.size === 0 ? new Set(defaultStepIds) : new Set(),
    );
  };

  if (loading) {
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
          '--sidebar-inner-width': `${PREVIEW_WIDTH}px`,
        } as React.CSSProperties
      }
      className='session-screen'
    >
      <SessionHeader />

      <div className='session-body'>
        <StepsNavSidebar
          areTooltipsVisible={visibleTooltips.size > 0}
          onToggleAllTooltips={toggleAllTooltips}
        />

        {(session?.active_view ?? 'prep') === 'prep' ? (
          <PrepView
            visibleTooltips={visibleTooltips}
            onToggleTooltip={toggleTooltipForStep}
          />
        ) : (
          <InGameView />
        )}
      </div>
    </GlassPanel>
  );
};
