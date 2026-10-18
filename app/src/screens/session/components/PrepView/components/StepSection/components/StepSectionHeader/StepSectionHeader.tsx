import { useSessionSteps } from '@/data-access-layer';
import { Checkbox } from '@/components/Checkbox/Checkbox';
import { ClickableIcon } from '@/components/ClickableIcon/ClickableIcon';
import { sessionStepName } from '@domain';
import './StepSectionHeader.css';
import { useParams } from '@tanstack/react-router';
import { FCProps } from '@/types/fcProps.type';
import { CircleQuestionMarkIcon, Trash2Icon } from 'lucide-react';
import { StepSectionHeaderTitle } from './components/StepSectionHeaderTitle/StepSectionHeaderTitle';
import { StepSectionHeaderMoveBtn } from './components/StepSectionHeaderMoveBtn/StepSectionHeaderMoveBtn';
import { useDeleteDialog } from '@/providers/DeleteDialogProvider';

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

  if (!step) return;

  const stepName = sessionStepName(step.name, step.default_step_key);

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
        <ClickableIcon
          icon={<CircleQuestionMarkIcon />}
          isActive={tooltipVisible}
          onClick={onToggleTooltip}
          title='Show Tooltips'
          label='Show Tooltips'
        />
      )}

      <StepSectionHeaderMoveBtn stepId={stepId} />

      <ClickableIcon
        icon={<Trash2Icon />}
        variant='danger'
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
      />
    </div>
  );
};
