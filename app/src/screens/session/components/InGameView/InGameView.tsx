import { useSession, useSessionSteps } from '@/data-access-layer';
import { TextEditor } from '@/components';
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
      <div className='in-game-main'>
        <div className='in-game-summary'>
          <TextEditor
            textEditorId={`session-summary-${sessionId}`}
            value={session?.summary ?? ''}
            onChange={(summary) => {
              updateSession({ summary });
            }}
          />
        </div>

        <div className='in-game-steps'>
          {steps.map((step) => (
            <InGameStepSection key={step.id} step={step} />
          ))}
        </div>
      </div>
    </div>
  );
};
