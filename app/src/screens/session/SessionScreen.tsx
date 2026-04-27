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
import { CustomScrollArea, GlassPanel, HorizontalDivider } from '@/components';

export const SessionScreen = () => {
  const { sessionId, adventureId } = useParams({
    from: '/adventure/$adventureId/session/$sessionId',
  });

  const { session, loading } = useSession(sessionId, adventureId);
  const { steps } = useSessionSteps(sessionId);
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
      <SessionHeader />

      <HorizontalDivider />

      <div className='session-body'>
        <StepsNavSidebar
          areTooltipsVisible={visibleTooltips.size > 0}
          onToggleAllTooltips={toggleAllTooltips}
        />

        <CustomScrollArea>
          {(session?.active_view ?? 'prep') === 'prep' ? (
            <PrepView
              visibleTooltips={visibleTooltips}
              onToggleTooltip={toggleTooltipForStep}
            />
          ) : (
            <InGameView />
          )}
        </CustomScrollArea>
      </div>
    </GlassPanel>
  );
};
