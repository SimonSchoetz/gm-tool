import { useSession, useSessionSteps } from '@/data-access-layer';
import type { SessionStep } from '@db/session-step';
import { TextEditor } from '@/components';
import { StepsNavSidebar } from './StepsNavSidebar/StepsNavSidebar';
import './InGameView.css';

type InGameStepSectionProps = {
  step: SessionStep;
  sessionId: string;
};

const InGameStepSection = ({ step, sessionId }: InGameStepSectionProps) => {
  const { updateStep } = useSessionSteps(sessionId);

  return (
    <div id={`step-section-${step.id}`} className='in-game-step-section'>
      <div className='in-game-step-header'>
        <input
          type='checkbox'
          className='in-game-step-checkbox'
          checked={step.checked === 1}
          onChange={() => { updateStep(step.id, { checked: step.checked ? 0 : 1 }); }}
        />
        <span className='in-game-step-name'>{step.name ?? 'Untitled Step'}</span>
      </div>

      <TextEditor
        textEditorId={`in-game-step-${step.id}`}
        value={step.content ?? ''}
        readOnly
      />
    </div>
  );
};

type Props = {
  sessionId: string;
  adventureId: string;
};

export const InGameView = ({ sessionId, adventureId }: Props) => {
  const { session, loading: sessionLoading, updateSession } = useSession(sessionId, adventureId);
  const { steps, loading: stepsLoading } = useSessionSteps(sessionId);

  if (sessionLoading || stepsLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className='in-game-view'>
      <StepsNavSidebar sessionId={sessionId} />

      <div className='in-game-main'>
        <div className='in-game-summary'>
          <TextEditor
            textEditorId={`session-summary-${sessionId}`}
            value={session?.summary ?? ''}
            onChange={(summary) => { updateSession({ summary }); }}
          />
        </div>

        <div className='in-game-steps'>
          {steps.map((step) => (
            <InGameStepSection
              key={step.id}
              step={step}
              sessionId={sessionId}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
