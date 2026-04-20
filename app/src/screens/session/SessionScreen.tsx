import { useState } from 'react';
import { useParams } from '@tanstack/react-router';
import { useSession, useSessionSteps } from '@/data-access-layer';
import {
  SessionHeader,
  PrepView,
  InGameView,
  StepsNavSidebar,
} from './components';
import './SessionScreen.css';
import { GlassPanel } from '@/components';

export type View = 'prep' | 'ingame';

export const SessionScreen = () => {
  const { sessionId, adventureId } = useParams({
    from: '/adventure/$adventureId/session/$sessionId',
  });

  const { loading } = useSession(sessionId, adventureId);
  const { steps } = useSessionSteps(sessionId);
  const [view, setView] = useState<View>('prep');
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-arguments -- new Set() infers Set<unknown> without the explicit type arg
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
    return <div>Loading...</div>;
  }

  return (
    <GlassPanel className='session-screen'>
      <StepsNavSidebar sessionId={sessionId} />

      <div>
        <SessionHeader
          sessionId={sessionId}
          adventureId={adventureId}
          view={view}
          onViewChange={setView}
          areTooltipsVisible={visibleTooltips.size > 0}
          onToggleAllTooltips={toggleAllTooltips}
        />
        {view === 'prep' ? (
          <PrepView
            sessionId={sessionId}
            visibleTooltips={visibleTooltips}
            onToggleTooltip={toggleTooltipForStep}
          />
        ) : (
          <InGameView sessionId={sessionId} adventureId={adventureId} />
        )}
      </div>
    </GlassPanel>
  );
};
