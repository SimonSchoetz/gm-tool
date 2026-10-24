import { UpDownBtns } from '@/components/UpDownBtns/UpDownBtns';
import { useSessionSteps } from '@/data-access-layer';
import { FCProps } from '@/types/fcProps.type';
import { useParams } from '@tanstack/react-router';

type Props = {
  stepId: string;
};

export const StepSectionHeaderMoveBtn: FCProps<Props> = ({ stepId }) => {
  const { sessionId } = useParams({
    from: '/adventure/$adventureId/session/$sessionId',
  });

  const { steps, reorderSteps } = useSessionSteps(sessionId);
  const step = steps.find((s) => s.id === stepId) ?? null;

  if (!step) return;

  const stepIndex = steps.findIndex((s) => s.id === stepId);
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === steps.length - 1;

  return (
    <UpDownBtns
      upLabel='Move up'
      downLabel='Move down'
      isUpDisabled={isFirst}
      isDownDisabled={isLast}
      onUp={() => {
        reorderSteps(step.id, 'up');
      }}
      onDown={() => {
        reorderSteps(step.id, 'down');
      }}
    />
  );
};
