import { TextEditor } from '@/components';
import { useSessionSteps } from '@/data-access-layer';
import type { SessionStep } from '@db/session-step';
import './InGameStepSection.css';
import { useParams } from '@tanstack/react-router';

type InGameStepSectionProps = {
  step: SessionStep;
};

export const InGameStepSection = ({ step }: InGameStepSectionProps) => {
  const { sessionId } = useParams({
    from: '/adventure/$adventureId/session/$sessionId',
  });
  const { updateStep } = useSessionSteps(sessionId);

  return (
    <div id={`step-section-${step.id}`} className='in-game-step-section'>
      <div className='in-game-step-header'>
        <input
          type='checkbox'
          className='in-game-step-checkbox'
          checked={step.checked === 1}
          onChange={() => {
            updateStep(step.id, { checked: step.checked ? 0 : 1 });
          }}
        />
        <span className='in-game-step-name'>
          {step.name ?? 'Untitled Step'}
        </span>
      </div>

      <TextEditor
        textEditorId={`in-game-step-${step.id}`}
        value={step.content ?? ''}
        readOnly
      />
    </div>
  );
};
