import { useSession, useSessionSteps } from '@/data-access-layer';
import { CustomScrollArea, GlassPanel, TextEditor } from '@/components';
import { useParams } from '@tanstack/react-router';
import { InGameStepSection } from './components';
import './InGameView.css';

export const InGameView = () => {
  const { sessionId, adventureId } = useParams({
    from: '/adventure/$adventureId/session/$sessionId',
  });
  const {
    session,
    loading: sessionLoading,
    updateSession,
  } = useSession(sessionId, adventureId);
  const { steps, loading: stepsLoading } = useSessionSteps(sessionId);

  if (sessionLoading || stepsLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className='in-game-view'>
      <GlassPanel className='in-game-summary'>
        <CustomScrollArea className='in-game-summary-scroll-area'>
          <TextEditor
            textEditorId={`session-summary-${sessionId}`}
            value={session?.summary ?? ''}
            onChange={(summary) => {
              updateSession({ summary });
            }}
            placeholder='Ingame notes and session summmary...'
          />
        </CustomScrollArea>
      </GlassPanel>

      <CustomScrollArea className='in-game-steps'>
        {steps.map((step) => (
          <InGameStepSection key={step.id} step={step} />
        ))}
      </CustomScrollArea>
    </div>
  );
};
