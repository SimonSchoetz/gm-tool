import { TextEditor } from '@/components/TextEditor';
import { useSessionSteps } from '@/data-access-layer';
import { FCProps } from '@/types/fcProps.type';
import './InGameStepSection.css';
import { useParams } from '@tanstack/react-router';
import { InGameStepSectionTitle } from './components/InGameStepSectionTitle/InGameStepSectionTitle';
import { stepSectionElementId } from '../../../../helper/stepSectionElementId';

type Props = {
  stepId: string;
};

export const InGameStepSection: FCProps<Props> = ({ stepId }) => {
  const { sessionId } = useParams({
    from: '/adventure/$adventureId/session/$sessionId',
  });
  const { steps, updateStep } = useSessionSteps(sessionId);
  const step = steps.find((s) => s.id === stepId);

  if (!step) return;

  return (
    <div id={stepSectionElementId(step.id)} className='in-game-step-section'>
      <InGameStepSectionTitle stepId={step.id} />
      <TextEditor
        textEditorId={`in-game-step-${step.id}`}
        value={step.content ?? ''}
        readOnly
        onChange={(content) => {
          updateStep(step.id, { content });
        }}
      />
    </div>
  );
};
