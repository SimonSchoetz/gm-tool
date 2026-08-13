import { useSession, useSessionSteps } from '@/data-access-layer';
import { GlassPanel, LoadingIcon, TextEditor } from '@/components';
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
    return (
      <div className='content-center'>
        <LoadingIcon />
      </div>
    );
  }

  return (
    <div className='in-game-view'>
      <GlassPanel className='in-game-view--summary'>
        <TextEditor
          className='in-game-view--summary-text-editor'
          textEditorId={`session-summary-${sessionId}`}
          value={session?.summary ?? ''}
          onChange={(summary) => {
            updateSession({ summary });
          }}
          placeholder='Ingame notes and session summmary...'
        />
      </GlassPanel>

      <div className='in-game-view--steps'>
        {steps.map((step) => (
          <InGameStepSection key={step.id} step={step} />
        ))}
      </div>
    </div>
  );
};
