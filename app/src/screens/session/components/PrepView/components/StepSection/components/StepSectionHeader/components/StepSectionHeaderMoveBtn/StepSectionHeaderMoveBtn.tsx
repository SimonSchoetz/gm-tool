import { ActionContainer } from '@/components';
import { useSessionSteps } from '@/data-access-layer';
import { FCProps } from '@/types';
import { useParams } from '@tanstack/react-router';
import { ChevronUpIcon, ChevronDownIcon } from 'lucide-react';
import './StepSectionHeaderMoveBtn.css';

type Props = {
  stepId: string;
};

export const StepSectionHeaderMoveBtn: FCProps<Props> = ({ stepId }) => {
  const { sessionId } = useParams({
    from: '/adventure/$adventureId/session/$sessionId',
  });

  const { steps, reorderSteps } = useSessionSteps(sessionId);
  const step = steps.find((s) => s.id === stepId);

  if (!step) return null;

  const stepIndex = steps.findIndex((s) => s.id === stepId);
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === steps.length - 1;

  return (
    <div className='step-move-btn-container'>
      <ActionContainer
        className='step-move-btn'
        disabled={isFirst}
        title='Move up'
        label='Move up'
        onClick={() => {
          reorderSteps(step.id, 'up');
        }}
      >
        <ChevronUpIcon />
      </ActionContainer>

      <ActionContainer
        className='step-move-btn'
        disabled={isLast}
        title='Move down'
        label='Move down'
        onClick={() => {
          reorderSteps(step.id, 'down');
        }}
      >
        <ChevronDownIcon />
      </ActionContainer>
    </div>
  );
};
