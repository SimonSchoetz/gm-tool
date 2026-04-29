import { useSessionSteps } from '@/data-access-layer';
import { Checkbox, ActionContainer } from '@/components';
import { LAZY_DM_STEPS } from '@/domain';
import './StepSectionHeader.css';
import { useParams } from '@tanstack/react-router';
import { FCProps } from '@/types';
import { CircleQuestionMarkIcon, Trash2Icon } from 'lucide-react';
import { StepSectionHeaderTitle, StepSectionHeaderMoveBtn } from './components';
import { cn } from '@/util';
import { useDeleteDialog } from '@/providers';

type Props = {
  stepId: string;
  onToggleTooltip: () => void;
  tooltipVisible: boolean;
};

export const StepSectionHeader: FCProps<Props> = ({
  stepId,
  onToggleTooltip,
  tooltipVisible,
}) => {
  const { sessionId } = useParams({
    from: '/adventure/$adventureId/session/$sessionId',
  });
  const { steps, updateStep, deleteStep } = useSessionSteps(sessionId);
  const step = steps.find((s) => s.id === stepId);
  const { openDeleteDialog } = useDeleteDialog();

  if (!step) return null;

  const lazyStep = LAZY_DM_STEPS.find((s) => s.key === step.default_step_key);
  const stepName = step.name ?? lazyStep?.name ?? 'Untitled Sepp';

  return (
    <div className='step-section-header'>
      <Checkbox
        id={`step-checkbox-${step.id}`}
        checked={step.checked === 1}
        onChange={() => {
          updateStep(step.id, { checked: step.checked ? 0 : 1 });
        }}
      />

      <StepSectionHeaderTitle stepId={step.id} />

      {step.default_step_key !== null && (
        <ActionContainer
          className={cn(
            'step-tooltip-btn',
            tooltipVisible && 'step-tooltip-btn__active',
          )}
          onClick={onToggleTooltip}
          title='Show Tooltips'
          label='Show Tooltips'
        >
          <CircleQuestionMarkIcon />
        </ActionContainer>
      )}

      <StepSectionHeaderMoveBtn stepId={stepId} />

      <ActionContainer
        className='step-delete-btn'
        title='Delete step'
        label='Delete step'
        onClick={() => {
          openDeleteDialog({
            name: `Step: ${stepName}`,
            onDeletionConfirm: () => {
              void deleteStep(step.id);
            },
            oneClickConfirm: true,
          });
        }}
      >
        <Trash2Icon />
      </ActionContainer>
    </div>
  );
};
